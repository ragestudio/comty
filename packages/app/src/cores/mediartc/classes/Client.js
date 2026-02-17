export default class Client {
	constructor(core, data) {
		this.core = core
		this.userId = data.userId
		this.self = this.userId === app.userData._id

		if (data.voiceState) {
			this.voiceState = data.voiceState
		}

		this.core.state.clients.push({
			userId: this.userId,
			voiceState: this.voiceState,
			micConsumerId: null,
			self: this.self,
		})
	}

	micConsumer = null
	micAudioElement = null
	micSourceGainNode = null

	voiceState = {
		muted: false,
		deafened: false,
	}

	localState = {
		muted: false,
		volume: 1,
	}

	setVolume = (volume) => {
		this.localState.volume = volume / 100

		if (this.micSourceGainNode) {
			this.micSourceGainNode.gain.value = this.localState.muted
				? 0
				: this.localState.volume
		}
	}

	toggleMute = (to) => {
		if (typeof to !== "boolean") {
			to = !this.localState.muted
		}

		this.localState.muted = to

		if (to === true) {
			this.micSourceGainNode.gain.value = 0
		} else {
			this.micSourceGainNode.gain.value = this.localState.volume
		}

		// update the voice state
		this.coreState.voiceState.muted = to
	}

	// find producers of this client
	//getProducers = async () => {}

	attachMic = async (payload) => {
		// start the consumer
		const consumer = await this.core.consumers.start({
			producerId: payload.producerId,
			userId: this.userId,
			kind: "audio",
			appData: payload.appData,
		})

		this.micConsumer = consumer
		this.coreState.micConsumerId = consumer.id

		const audioElement = (this.micAudioElement = new Audio())
		const mediaStream = new MediaStream([consumer.track])
		const source =
			this.core.self.audioOutput.context.createMediaStreamSource(
				mediaStream,
			)

		this.micSourceGainNode = this.core.self.audioOutput.context.createGain()
		this.micSourceGainNode.gain.value = 1

		audioElement.volume = 1
		audioElement.srcObject = mediaStream
		audioElement.muted = true
		audioElement.onerror = (error) => {
			this.core.console.error("Audio playback error:", error)
		}

		source.connect(this.micSourceGainNode)
		this.micSourceGainNode.connect(this.core.self.audioOutput.mainNode)

		await audioElement.play()

		this.core.console.debug(`Attached client mic [${this.userId}]`)
	}

	dettachMic = async () => {
		if (this.micAudioElement) {
			this.micAudioElement.pause()
			this.micAudioElement.srcObject = null

			if (this.micAudioElement.parentNode) {
				this.micAudioElement.parentNode.removeChild(
					this.micAudioElement,
				)
			}

			// disconnect the source
			this.micSourceGainNode.disconnect(
				this.core.self.audioOutput.mainNode,
			)

			// remove nodes
			this.micAudioElement = null
			this.micSourceGainNode = null
		}

		if (this.micConsumer) {
			await this.core.consumers.stop(this.micConsumer.id)
			this.micConsumer = null
		}

		this.core.console.debug(`Detached client mic [${this.userId}]`)
	}

	onLeave = async () => {
		if (this.micConsumer || this.micAudioElement) {
			await this.dettachMic()
		}

		// remove from the producers
		if (this.coreStateIndex !== -1) {
			this.core.state.clients.splice(this.coreStateIndex, 1)
		}
	}

	updateVoiceState = (update) => {
		this.voiceState = {
			...this.voiceState,
			...update,
		}

		this.coreState.voiceState = this.voiceState
	}

	get coreStateIndex() {
		return this.core.state.clients.findIndex((clientState) => {
			return clientState.userId === this.userId
		})
	}

	get coreState() {
		return this.core.state.clients[this.coreStateIndex]
	}

	set coreState(state) {
		const coreStateIndex = this.coreStateIndex

		if (coreStateIndex !== -1) {
			this.core.state.clients[coreStateIndex] = state
		}
	}
}
