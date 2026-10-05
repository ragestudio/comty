import type { RTC } from ".."
import { type BaseStream, StreamsKinds } from "./streams/base"

type StreamStartParams<Kind extends keyof typeof StreamsKinds> = Parameters<
	ReturnType<(typeof StreamsKinds)[Kind]>["start"]
>[0]

class IndexedArray<T> extends Array<T> {
	insert(item: T) {
		return this.push(item) - 1
	}

	delete(item: T) {
		const index = this.indexOf(item)

		if (index !== -1) {
			this.splice(index, 1)
		}

		return index
	}

	clear() {
		this.splice(0, this.length)
	}
}

export class Self {
	constructor(core: RTC) {
		this.core = core
	}

	core: RTC
	streams: IndexedArray<BaseStream> = new IndexedArray()
	streams_ref: Map<string, number> = new Map()

	micProducerId: string | null = null
	screenProducerId: string | null = null

	localState = {
		isMuted: false,
		isDeafened: false,
	}

	// get the state from streams instead of a value, this is more reliable & secure
	get isMuted() {
		const micStreamIndex = this.streams_ref.get("mic")
		if (micStreamIndex === undefined) return false
		const micStream = this.streams[micStreamIndex]
		return micStream?.stream?.getAudioTracks()[0]?.enabled === false
	}

	// get the state from local state
	get isDeafened() {
		return this.localState.isDeafened
	}

	toggleMute(to?: boolean) {
		if (to === undefined) to = !this.isMuted

		// itterate all over streams of kind "mic"
		for (const stream of this.streams) {
			if (stream.kind !== "mic" || !stream.stream) continue

			for (const track of stream.stream?.getAudioTracks()) {
				if (to) {
					track.enabled = false
				} else {
					track.enabled = true
				}
			}
		}

		// sync voice state
		this.localState.isMuted = to
		this.core.handlers.syncVoiceState()
	}

	toggleDeafened(to?: boolean) {
		if (to === undefined) to = !this.isDeafened

		for (const [_id, consumer] of this.core.consumers) {
			if (
				consumer.kind !== "audio" ||
				consumer.appData.mediaTag !== "user-mic"
			)
				continue

			if (to) {
				consumer.pause()
			} else {
				consumer.resume()
			}
		}

		// sync voice state
		this.localState.isDeafened = to
		this.core.handlers.syncVoiceState()
	}

	async createStream<Kind extends keyof typeof StreamsKinds>(
		kind: Kind,
		params?: StreamStartParams<Kind>,
	) {
		if (!StreamsKinds[kind]) {
			throw new Error(`Stream of kind [${kind}] is not available`)
		}

		const stream = StreamsKinds[kind](this)
		await stream.start(params)

		this.streams_ref.set(kind, this.streams.insert(stream))

		return stream
	}

	async deleteStream<T extends BaseStream<any>>(
		kind: keyof typeof StreamsKinds,
		stream: T,
		params?: Parameters<T["close"]>[0],
	) {
		await stream.close(params)

		this.streams.delete(stream)
		this.streams_ref.delete(kind)

		return stream
	}

	async deleteAll() {
		for (const stream of this.streams) {
			this.streams.delete(stream)
		}

		this.streams.clear()
		this.streams_ref.clear()
	}
}

export default Self
