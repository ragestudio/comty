import type { RTC } from ".."
import type { BaseStream } from "./streams/base"
import type { SelfMedia } from "./media"

import MicStream from "./streams/mic"
import ScreenStream from "./streams/screen"
import CameraStream from "./streams/camera"

import Microphone from "./media/mic"
import Screen from "./media/screen"
import Camera from "./media/camera"
import { computeScreenEncoding } from "./utils"
import Logger from "@comty/shared/utils/logger"
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

	// media creations in progress, so a second call does not start a second
	// capture, e.g. when the user taps the screenshare button twice while the
	// system dialog is still open
	private pendingMedia: Map<keyof typeof MediaKinds, Promise<any>> = new Map()

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

	// resize the live screen capture. only available when the host implements
	// applyConstraints for screen tracks
	async updateScreenConstraints(params: { width: number; height: number }) {
		const [track] = this.screenStream?.getVideoTracks() ?? []

		if (!track) return false

		try {
			await track.applyConstraints({
				width: params.width,
				height: params.height,
			} as MediaTrackConstraints)

			return true
		} catch (error) {
			logger.debug("failed to resize screen capture", error)

			return false
		}
	}

	// update the live screen share encoding, so quality and framerate changes
	// apply without restarting the capture (which would ask for permission again)
	async updateScreenEncoding(params?: { framerate?: number }) {
		const { screenVideoProducerId } = this.core.getState()

		if (!screenVideoProducerId) return false

		const producer = this.core.producers.get(screenVideoProducerId)
		const track = producer?.track ?? this.screenStream?.getVideoTracks()[0]

		if (!producer || !track) return false

		const sender = producer.rtpSender as any

		if (!sender?.getParameters || !sender?.setParameters) return false

		try {
			const encoding = computeScreenEncoding(track, params?.framerate)

			const senderParams = sender.getParameters()

			// screen shares always use a single encoding
			if (senderParams?.encodings?.length !== 1) return false

			// mutate the encoding in place, some hosts keep their own formats and
			// convert them when serializing the parameters
			const [base] = senderParams.encodings

			if (
				base.maxBitrate === encoding.maxBitrate &&
				base.maxFramerate === encoding.maxFramerate
			) {
				return true
			}

			const previous = {
				maxBitrate: base.maxBitrate,
				maxFramerate: base.maxFramerate,
			}

			base.maxBitrate = encoding.maxBitrate
			base.maxFramerate = encoding.maxFramerate

			try {
				await sender.setParameters(senderParams)
			} catch (error) {
				Object.assign(base, previous)

				throw error
			}

			return true
		} catch (error) {
			logger.warn("failed to update screen encoding", error)

			return false
		}
	}

	toggleMute(to?: boolean) {
		if (to === undefined) to = !this.localState.isMuted

		const changed = this.localState.isMuted !== to

		this.localState.isMuted = to

		this.applyMute()

		if (changed) {
			this.core.eventBus.emit(to ? "rtc:mute" : "rtc:unmute")
		}

		// sync voice state
		this.core.handlers.syncVoiceState()
	}

	toggleDeafened(to?: boolean) {
		if (to === undefined) to = !this.localState.isDeafened

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

		// the mute preference is kept, so undeafening restores it
		this.localState.isDeafened = to

		this.applyMute()

		if (changed) {
			this.core.eventBus.emit(to ? "rtc:deafen" : "rtc:undeafen")
		}

		// sync voice state
		this.core.handlers.syncVoiceState()
	}

	// restore the stored microphone preference on a captured stream
	applyMutePreference(stream?: MediaStream | null) {
		if (!stream) return

		// deafening also silences the microphone
		const isMuted = this.localState.isMuted || this.localState.isDeafened

		for (const track of stream.getAudioTracks()) {
			track.enabled = !isMuted
		}
	}

	// enable or disable the local microphone tracks
	private applyMute() {
		// deafening also silences the microphone
		const isMuted = this.localState.isMuted || this.localState.isDeafened

		for (const stream of this.streams.values()) {
			if (stream.kind !== "mic" || !stream.stream) continue

			for (const track of stream.stream.getAudioTracks()) {
				track.enabled = !isMuted
			}
		}
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

		const pending = this.pendingMedia.get(kind)

		if (pending) return pending

		const creation = this.createMediaTask(kind, params)

		this.pendingMedia.set(kind, creation)

		try {
			return await creation
		} finally {
			if (this.pendingMedia.get(kind) === creation) {
				this.pendingMedia.delete(kind)
			}
		}
	}

	private async createMediaTask<Kind extends keyof typeof MediaKinds>(
		kind: Kind,
		params?: MediaCreateParams<Kind>,
	) {
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
