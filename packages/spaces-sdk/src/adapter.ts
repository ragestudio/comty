import type { AudioDevice, AudioRouteMode } from "./rtc/audio/types"
import type { AudioProcessingAdapter } from "./rtc/audio/processing/types"
import type { LogLevel, LoggerSink } from "./utils/logger"

import session from "comty.js/core/session"
import logger from "./utils/logger"

export interface WebRtcObjects {
	RTCIceCandidate: RTCIceCandidate
	RTCCertificate: Partial<RTCCertificate>
	RTCPeerConnection: RTCPeerConnection
	RTCSessionDescription: RTCSessionDescription

	MediaStream: MediaStream
	MediaStreamTrack: MediaStreamTrack
	MediaStreamTrackEvent: MediaStreamTrackEvent

	RTCRtpTransceiver: RTCRtpTransceiver
	RTCRtpReceiver: RTCRtpReceiver
	RTCRtpSender: RTCRtpSender
	RTCErrorEvent: RTCErrorEvent

	mediaDevices: {
		getUserMedia: MediaDevices["getDisplayMedia"]
		getDisplayMedia: MediaDevices["getDisplayMedia"]
		enumerateDevices: MediaDevices["enumerateDevices"]
	}
}

interface SessionData {
	user_id?: string
	token?: string
}

export interface FrameTransformEvents {
	addListener(
		listener: unknown,
		eventName: string,
		handler: (event: any) => void,
	): void

	removeListener(listener: unknown): void
}

export interface AudioRouting {
	getAudioDevices(): Promise<AudioDevice[]>
	setSpeakerphoneOn(enabled: boolean): void
	isSpeakerphoneOn(): Promise<boolean>
	setAudioOutputDevice(deviceId: string): Promise<boolean>
	setAudioInputDevice?(deviceId: string): Promise<boolean>
	setAudioRouteMode?(mode: AudioRouteMode): Promise<boolean>
	isBluetoothAvailable?(): Promise<boolean>
	resetAudioRouting?(): Promise<boolean>
	// false on runtimes without an earpiece/speaker concept (web)
	supportsSpeakerphone?: boolean
}

// notifies when the set of available audio devices changes (hotplug)
export interface AudioDevicesEvents {
	subscribe(handler: () => void): () => void
}

export type TrackVolume = {
	setVolume(track: MediaStreamTrack, gain: number): void
}

export type MediaStreamKind = "mic" | "camera" | "screen"

// synchronous key-value storage for the audio preferences. hosts provide one
// per runtime (localStorage on web, native preferences on react native)
export interface AudioSettingsStorage {
	get<T = unknown>(key: string): T | undefined
	set(key: string, value: unknown): void
}

// post-process a captured local stream, e.g. a web audio chain with rnnoise,
// gain and gate. the host returns the stream that should be published
export type MediaStreamProcessor = (
	stream: MediaStream,
	kind: MediaStreamKind,
) => Promise<MediaStream> | MediaStream

// native system audio capture (e.g. electron loopback), used for screen share
// audio when the platform does not expose it through getDisplayMedia
export interface SystemAudioCapture {
	isSupported(): boolean | Promise<boolean>
	start(): Promise<MediaStreamTrack | null>
	stop(): Promise<void>
}

// releases the resources behind a processed stream, e.g. the raw capture and
// the audio graph when the host wraps the mic with a processing chain
export type MediaStreamReleaser = (stream: MediaStream) => void

export type AudioProcessing = AudioProcessingAdapter

export class Adapter {
	constructor() {}

	webRtcObjects?: WebRtcObjects

	// defaults to the comty.js session, can be overridden by the host app
	sessionGetter: () => Promise<SessionData> = async () => ({
		token: session.token,
		user_id: session.user_id,
	})
	frameTransformEvents?: FrameTransformEvents
	audioRouting?: AudioRouting
	audioDevicesEvents?: AudioDevicesEvents
	audioProcessing?: AudioProcessing
	trackVolume?: TrackVolume
	mediaStreamProcessor?: MediaStreamProcessor
	mediaStreamReleaser?: MediaStreamReleaser
	systemAudio?: SystemAudioCapture
	audioSettings?: AudioSettingsStorage

	registerWebRtcGlobals(objects: WebRtcObjects) {
		this.webRtcObjects = objects
	}

	registerSessionDataGetter(getter: typeof this.sessionGetter) {
		this.sessionGetter = getter
	}

	registerFrameTransformEvents(events: FrameTransformEvents) {
		this.frameTransformEvents = events
	}

	registerAudioRouting(routing: AudioRouting) {
		this.audioRouting = routing
	}

	registerAudioDevicesEvents(events: AudioDevicesEvents) {
		this.audioDevicesEvents = events
	}

	registerAudioProcessing(processing: AudioProcessing) {
		this.audioProcessing = processing
	}

	registerTrackVolume(trackVolume: TrackVolume) {
		this.trackVolume = trackVolume
	}

	registerMediaStreamProcessor(processor: MediaStreamProcessor) {
		this.mediaStreamProcessor = processor
	}

	registerMediaStreamReleaser(releaser: MediaStreamReleaser) {
		this.mediaStreamReleaser = releaser
	}

	registerSystemAudio(capture: SystemAudioCapture) {
		this.systemAudio = capture
	}

	registerAudioSettingsStorage(storage: AudioSettingsStorage) {
		this.audioSettings = storage
	}

	// route the sdk logs to a custom sink, e.g. the host app console or a
	// crash reporter, defaults to the global console
	registerLogger(sink: LoggerSink) {
		logger.setSink(sink)
	}

	// set the sdk log verbosity, defaults to "debug"
	registerLogLevel(level: LogLevel) {
		logger.setLevel(level)
	}
}

export const adapter = new Adapter()

export type { LogLevel, LoggerSink } from "./utils/logger"

export default adapter
