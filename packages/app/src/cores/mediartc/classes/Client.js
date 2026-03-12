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
	micMediaStream = null
	mediaStreamSource = null
	micSourceGainNode = null
	connectedDestination = null

	micAudioElement = null

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

		if (this.micSourceGainNode) {
			this.micSourceGainNode.gain.value = this.localState.muted
				? 0
				: this.localState.volume
		}
		this.coreState.voiceState.muted = to
	}

	attachMic = async (payload) => {
		const consumer = await this.core.consumers.start({
			producerId: payload.producerId,
			userId: this.userId,
			kind: "audio",
			appData: payload.appData,
		})

		this.micConsumer = consumer
		this.coreState.micConsumerId = consumer.id

		this.micMediaStream = new MediaStream([consumer.track])

		const audioElement = (this.micAudioElement = new Audio())
		audioElement.srcObject = this.micMediaStream
		audioElement.muted = true
		audioElement.onerror = (error) =>
			this.core.console.error("Audio playback error:", error)

		const hasSysAudio = !!(
			this.core.self.sysAudio && this.core.self.sysAudio.outputCtx
		)
		const ctx = hasSysAudio
			? this.core.self.sysAudio.outputCtx
			: this.core.self.audioOutput.context

		if (ctx.state === "suspended") {
			await ctx
				.resume()
				.catch((err) =>
					this.core.console.error("Cannot resume AudioContext:", err),
				)
		}

		this.connectedDestination = hasSysAudio
			? this.core.self.sysAudio.outputBus
			: this.core.self.audioOutput.mainNode

		this.mediaStreamSource = ctx.createMediaStreamSource(
			this.micMediaStream,
		)
		this.micSourceGainNode = ctx.createGain()

		this.micSourceGainNode.gain.value = this.localState.muted
			? 0
			: this.localState.volume

		this.mediaStreamSource.connect(this.micSourceGainNode)
		this.micSourceGainNode.connect(this.connectedDestination)

		await audioElement
			.play()
			.catch((e) =>
				this.core.console.warn("Failed to play mic audio:", e),
			)

		this.core.console.debug(
			`Attached client mic [${this.userId}] - Routed via ${hasSysAudio ? "SysAudio (native)" : "Browser Audio Node"}`,
		)
	}

	dettachMic = async () => {
		if (this.micAudioElement) {
			this.micAudioElement.pause()
			this.micAudioElement.srcObject = null
			this.micAudioElement = null
		}

		if (this.micSourceGainNode) {
			if (this.connectedDestination) {
				this.micSourceGainNode.disconnect(this.connectedDestination)
			}
			this.micSourceGainNode = null
		}

		if (this.mediaStreamSource) {
			this.mediaStreamSource.disconnect()
			this.mediaStreamSource = null
		}

		this.micMediaStream = null
		this.connectedDestination = null

		if (this.micConsumer) {
			await this.core.consumers.stop(this.micConsumer.id)
			this.micConsumer = null
		}

		this.core.console.debug(`Detached client mic[${this.userId}]`)
	}

	onLeave = async () => {
		if (this.micConsumer || this.micMediaStream) {
			await this.dettachMic()
		}

		if (this.coreStateIndex !== -1) {
			this.core.state.clients.splice(this.coreStateIndex, 1)
		}
	}

	updateVoiceState = (update) => {
		this.voiceState = { ...this.voiceState, ...update }
		this.coreState.voiceState = this.voiceState
	}

	getAvailableProducers() {
		let producers = []
		for (const [_, producer] of this.core.producers) {
			if (producer.userId === this.userId) {
				producers.push(producer)
			}
		}
		return producers
	}

	get coreStateIndex() {
		return this.core.state.clients.findIndex(
			(c) => c.userId === this.userId,
		)
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
