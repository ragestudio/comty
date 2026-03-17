import { Observable } from "object-observer"

export interface MediaRTCStateType {
	isJoined: boolean
	isLoading: boolean
	isMuted: boolean
	isDeafened: boolean
	isSpeaking: boolean
	isProducingAudio: boolean
	isProducingScreen: boolean
	isProducingCamera: boolean
	channel: any | null
	channelId: string | null
	clients: any[]
	remoteProducers: any[]
	speakingConsumers: string[]
	recvTransportState: string
	sendTransportState: string
	status?: string
}

export default class MediaRTCState {
	static defaultState: MediaRTCStateType = {
		isJoined: false,
		isLoading: false,
		isMuted: false,
		isDeafened: false,
		isSpeaking: false,
		isProducingAudio: false,
		isProducingScreen: false,
		isProducingCamera: false,
		channel: null,
		channelId: null,
		clients: [],
		remoteProducers: [],
		speakingConsumers: [],
		recvTransportState: "closed",
		sendTransportState: "closed",
	}

	state: MediaRTCStateType

	constructor(core?: any) {
		this.state = Observable.from(
			MediaRTCState.defaultState,
		) as MediaRTCStateType

		Observable.observe(this.state, (changes) => {
			try {
				app.eventBus.emit("mediartc:state:change", {
					...changes[changes.length - 1].object,
				})
			} catch (error) {
				console.error(error)
			}
		})

		return this.state as any
	}
}
