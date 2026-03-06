import { Observable } from "object-observer"

export default class MediaRTCState {
	static defaultState = {
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
		clients: Array(),
		remoteProducers: Array(),
		speakingConsumers: Array(),
		recvTransportState: "closed",
		sendTransportState: "closed",
	}

	constructor() {
		this.state = Observable.from(MediaRTCState.defaultState)

		Observable.observe(this.state, (changes) => {
			try {
				app.eventBus.emit("mediartc:state:change", {
					...changes[changes.length - 1].object,
				})
			} catch (error) {
				console.error(error)
			}
		})

		return this.state
	}
}
