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
}

// notifies when the set of available audio devices changes (hotplug)
export interface AudioDevicesEvents {
	subscribe(handler: () => void): () => void
}

export interface TrackVolume {
	setVolume(track: MediaStreamTrack, gain: number): void
}

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
