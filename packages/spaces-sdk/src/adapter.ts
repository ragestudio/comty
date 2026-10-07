import type { AudioDevice } from "./rtc/audio/types"
import type { AudioProcessingAdapter } from "./rtc/audio/processing/types"

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
}

export type AudioProcessing = AudioProcessingAdapter

export class Adapter {
	constructor() {}

	baseApiUrl: string = "https://api.comty.app"
	websocketPath: string = "/ws"

	webRtcObjects?: WebRtcObjects

	sessionGetter?: () => Promise<SessionData>
	frameTransformEvents?: FrameTransformEvents
	audioRouting?: AudioRouting
	audioProcessing?: AudioProcessing

	get webSocketEndpoint(): string {
		return new URL(this.websocketPath, this.baseApiUrl).toString()
	}

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

	registerAudioProcessing(processing: AudioProcessing) {
		this.audioProcessing = processing
	}
}

export const adapter = new Adapter()

export default adapter
