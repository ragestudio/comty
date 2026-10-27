import type { RTC } from ".."
import type { BaseStream } from "./streams/base"
import type { SelfMedia } from "./media"

import MicStream from "./streams/mic"
import ScreenStream from "./streams/screen"
import CameraStream from "./streams/camera"

import Microphone from "./media/mic"
import Screen from "./media/screen"
import Camera from "./media/camera"
import Logger from "@/utils/logger"
import { releaseMediaStreamURL } from "@/utils/mediaStreamURL"

export const StreamsKinds = {
	mic: MicStream,
	screen: ScreenStream,
	cam: CameraStream,
}

export const MediaKinds = {
	mic: Microphone,
	screen: Screen,
	cam: Camera,
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

export const logger = Logger.child("self")

export class Self {
	constructor(core: RTC) {
		this.core = core
	}

	core: RTC
	streams: Map<keyof typeof StreamsKinds, BaseStream> = new Map()

	media: Map<keyof typeof MediaKinds, SelfMedia<any>> = new Map()

	localState = {
		isMuted: false,
		isDeafened: false,
	}

	// get the state from streams instead of a value, this is more reliable & secure
	get isMuted() {
		const micStream = this.streams.get("mic")

		return micStream?.stream?.getAudioTracks()[0]?.enabled === false
	}

	// get the state from local state
	get isDeafened() {
		return this.localState.isDeafened
	}

	// the local screen share stream, null while not sharing
	get screenStream(): MediaStream | null {
		return this.streams.get("screen")?.stream ?? null
	}

	// apply new constraints to the live screen video track, e.g. resolution
	async updateScreenConstraints(constraints: MediaTrackConstraints) {
		const [track] = this.screenStream?.getVideoTracks() ?? []

		if (!track) return false

		await track.applyConstraints(constraints)

		return true
	}

	toggleMute(to?: boolean) {
		if (to === undefined) to = !this.isMuted

		const changed = this.localState.isMuted !== to

		this.applyMute(to)

		if (changed) {
			this.core.eventBus.emit(to ? "rtc:mute" : "rtc:unmute")
		}

		// sync voice state
		this.core.handlers.syncVoiceState()
	}

	toggleDeafened(to?: boolean) {
		if (to === undefined) to = !this.isDeafened

		const changed = this.localState.isDeafened !== to

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

		this.localState.isDeafened = to

		// deafening also mutes the microphone
		this.applyMute(to)

		if (changed) {
			this.core.eventBus.emit(to ? "rtc:deafen" : "rtc:undeafen")
		}

		// sync voice state
		this.core.handlers.syncVoiceState()
	}

	// enable or disable the local microphone tracks
	private applyMute(to: boolean) {
		for (const stream of this.streams.values()) {
			if (stream.kind !== "mic" || !stream.stream) continue

			for (const track of stream.stream.getAudioTracks()) {
				track.enabled = !to
			}
		}

		this.localState.isMuted = to
	}

	async createStream<Kind extends keyof typeof StreamsKinds>(
		kind: Kind,
		params?: StreamStartParams<Kind>,
	) {
		if (!StreamsKinds[kind]) {
			throw new Error(`Stream of kind [${kind}] is not available`)
		}

		// never leave a previous stream of the same kind capturing
		if (this.streams.has(kind)) {
			await this.deleteStreamByKind(kind)
		}

		const stream = StreamsKinds[kind](this)

		try {
			await stream.start(params)
		} catch (error) {
			// release anything captured before the failure
			await stream.close().catch(() => {})
			throw error
		}

		this.streams.set(kind, stream)

		return stream
	}

	async deleteStream<T extends BaseStream<any>>(
		kind: keyof typeof StreamsKinds,
		stream: T,
		params?: StreamStopParams<keyof typeof StreamsKinds>,
	) {
		try {
			await stream.close(params)
		} finally {
			releaseMediaStreamURL(stream.stream)

			// only remove the map entry if it still points to this stream
			if (this.streams.get(kind) === stream) {
				this.streams.delete(kind)
			}
		}

		logger.debug("deleted stream", stream)

		return stream
	}

	async deleteStreamByKind(kind: keyof typeof StreamsKinds) {
		const stream = this.streams.get(kind)

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

		try {
			await media.create(params)
		} catch (error) {
			// do not leak a stream captured before the producer failed
			await this.deleteStreamByKind(kind).catch(() => {})
			throw error
		}

		this.media.set(kind, media)

		return media
	}

	async destroyMedia<Kind extends keyof typeof MediaKinds>(
		type: keyof typeof MediaKinds,
		handler?: MediaDestroyParams<Kind>,
	) {
		const media = this.media.get(type)

		if (!media) return

		try {
			await media.destroy(handler)
		} finally {
			this.media.delete(type)
		}

		logger.debug("deleted media", media)
	}

	async deleteAll() {
		for (const kind of Array.from(this.media.keys())) {
			try {
				await this.destroyMedia(kind)
			} catch (error) {
				logger.error(`failed to destroy ${kind} media`, error)
			}
		}

		// close any stream that was not owned by a media instance (for example
		// when the media creation failed halfway) so the capture always stops
		for (const [kind, stream] of Array.from(this.streams.entries())) {
			try {
				await this.deleteStream(kind, stream)
			} catch (error) {
				logger.error(`failed to close ${kind} stream`, error)
			}
		}

		this.streams.clear()
	}
}

export default Self
