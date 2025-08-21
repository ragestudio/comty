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

	voiceState = {
		muted: false,
		deafened: false,
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

		const audioElement = new Audio()
		const mediaStream = new MediaStream([consumer.track])
		const source =
			this.core.self.audioOutput.context.createMediaStreamSource(
				mediaStream,
			)

		audioElement.srcObject = mediaStream
		audioElement.muted = true

		audioElement.onerror = (error) => {
			this.core.console.error("Audio playback error:", error)
		}

		source.connect(this.core.self.audioOutput.mainNode)

		this.micAudioElement = audioElement

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

			this.micAudioElement = null
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
