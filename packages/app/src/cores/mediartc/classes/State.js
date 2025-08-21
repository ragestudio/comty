import { Observable } from "object-observer"

export default class MediaRTCState {
	static defaultState = {
		status: "disconnected",
		isJoined: false,
		isLoading: false,
		isMuted: false,
		isDeafened: false,
		isProducingAudio: false,
		isProducingScreen: false,
		channel: null,
		channelId: null,
		clients: Array(),
		availableConsumers: Array(),
		recvTransportState: "closed",
		sendTransportState: "closed",
		micStreamAvailable: false,
	}

	constructor(core) {
		this.core = core

		this.state = Observable.from(MediaRTCState.defaultState)

		Observable.observe(this.state, (changes) => {
			try {
				app.eventBus.emit("mediartc:state:change", {
					...changes[changes.length - 1].object,
				})
			} catch (error) {
				this.core.console.error("Error logging state changes:", error)
			}
		})

		return this.state
	}
}
