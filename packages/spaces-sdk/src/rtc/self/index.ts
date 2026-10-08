import type { RTC } from ".."
import { type BaseStream } from "./streams/base"

import IndexedArray from "@/classes/IndexedArray"

import MicStream from "./streams/mic"
import ScreenStream from "./streams/screen"
import Microphone from "./media/mic"
import Screen from "./media/screen"
import { SelfMedia } from "./media"

export const StreamsKinds = {
	mic: MicStream,
	screen: ScreenStream,
}

export const MediaKinds = {
	mic: Microphone,
	screen: Screen,
}

type StreamStartParams<Kind extends keyof typeof StreamsKinds> = Parameters<
	ReturnType<(typeof StreamsKinds)[Kind]>["start"]
>[0]

type StreamStopParams<Kind extends keyof typeof StreamsKinds> = Parameters<
	ReturnType<(typeof StreamsKinds)[Kind]>["close"]
>[0]

type MediaCreateParams<Kind extends keyof typeof MediaKinds> = Parameters<
	ReturnType<(typeof MediaKinds)[Kind]>["create"]
>[0]
type MediaDestroyParams<Kind extends keyof typeof MediaKinds> = Parameters<
	ReturnType<(typeof MediaKinds)[Kind]>["destroy"]
>[0]

export class Self {
	constructor(core: RTC) {
		this.core = core
	}

	core: RTC
	streams: IndexedArray<BaseStream> = new IndexedArray()
	streams_ref: Map<string, number> = new Map()

	media: Map<keyof typeof MediaKinds, SelfMedia<any>> = new Map()

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

	// the local screen share stream, null while not sharing
	get screenStream(): MediaStream | null {
		const index = this.streams_ref.get("screen")

		if (index === undefined) return null

		return this.streams[index]?.stream ?? null
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

		// deafen only silences microphones, screen shares keep playing
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
		this.toggleMute(to)
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
		params?: StreamStopParams<keyof typeof StreamsKinds>,
	) {
		await stream.close(params)

		this.streams.delete(stream)
		this.streams_ref.delete(kind)

		return stream
	}

	async deleteStreamByKind(kind: keyof typeof StreamsKinds) {
		const index = this.streams_ref.get(kind)

		if (index === undefined) return

		const stream = this.streams[index]

		if (!stream) return

		await this.deleteStream(kind, stream)
	}

	async createMedia<Kind extends keyof typeof StreamsKinds>(
		kind: Kind,
		params?: MediaCreateParams<Kind>,
	) {
		if (!MediaKinds[kind]) {
			throw new Error(`Media of kind [${kind}] is not available`)
		}

		if (this.media.has(kind)) {
			await this.destroyMedia(kind)
		}

		const media = MediaKinds[kind](this)
		await media.create(params)

		this.media.set(kind, media)

		return media
	}

	async destroyMedia<Kind extends keyof typeof MediaKinds>(
		type: keyof typeof MediaKinds,
		handler?: MediaDestroyParams<Kind>,
	) {
		const media = this.media.get(type)

		if (!media) return

		await media.destroy(handler)
		this.media.delete(type)
	}

	async deleteAll() {
		for (const [key, media] of this.media) {
			await this.destroyMedia(key)
		}

		for (const stream of this.streams) {
			this.streams.delete(stream)
		}

		this.streams.clear()
		this.streams_ref.clear()
	}
}

export default Self
