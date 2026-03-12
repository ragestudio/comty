export default class SysAudio {
	constructor() {
		if (!window.ipcRenderer) {
			throw new Error("SysAudio requires ipcRenderer")
		}
		if (!window.AudioContext) {
			throw new Error("SysAudio requires AudioContext")
		}
	}

	get audioInputTrack() {
		if (!this.inputDestination) {
			return null
		}
		return this.inputDestination.stream.getAudioTracks()[0]
	}

	inputCtx = new AudioContext({
		sampleRate: 44100,
		latencyHint: "interactive",
	})
	outputCtx = new AudioContext({
		sampleRate: 44100,
		latencyHint: "interactive",
	})

	inputDestination = null
	outputBus = null

	pcmInputWorklet = null
	pcmOutputWorklet = null

	initialize = async () => {
		await this.initializeInput()
		await this.initializeOutput()
	}

	initializeInput = async () => {
		await this.inputCtx.audioWorklet.addModule(
			new URL("../worklets/pcm-input.js", import.meta.url),
		)

		this.pcmInputWorklet = new AudioWorkletNode(
			this.inputCtx,
			"pcm-input",
			{
				outputChannelCount: [2],
			},
		)

		window.ipcRenderer.on("sysaudio:input", (_, data) => {
			this.pcmInputWorklet.port.postMessage(data, [data.buffer.buffer])
		})
	}

	initializeOutput = async () => {
		await this.outputCtx.audioWorklet.addModule(
			new URL("../worklets/pcm-output.js", import.meta.url),
		)

		this.outputBus = this.outputCtx.createGain()

		this.pcmOutputWorklet = new AudioWorkletNode(
			this.outputCtx,
			"pcm-output",
		)

		this.outputBus.connect(this.pcmOutputWorklet)

		this.pcmOutputWorklet.port.onmessage = (event) => {
			const buffer = new Uint8Array(event.data)

			window.ipcRenderer.send("sysaudio:output", buffer, {
				sampleRate: this.outputCtx.sampleRate,
				bitsPerSample: 16,
				channels: 2,
			})
		}

		const silenceGain = this.outputCtx.createGain()
		silenceGain.gain.value = 0

		this.pcmOutputWorklet.connect(silenceGain)
		silenceGain.connect(this.outputCtx.destination)
	}

	startCapture = async () => {
		await window.ipcRenderer.invoke("sysaudio:startCapture")

		if (this.inputDestination) {
			try {
				this.pcmInputWorklet.disconnect(this.inputDestination)
			} catch (e) {}
		}

		this.inputDestination = this.inputCtx.createMediaStreamDestination()
		this.inputDestination.channelCountMode = "explicit"
		this.inputDestination.channelCount = 2

		this.pcmInputWorklet.connect(this.inputDestination)

		return this.audioInputTrack
	}

	stopCapture = async () => {
		if (this.inputDestination) {
			this.inputDestination.stream.getTracks().forEach((t) => t.stop())

			try {
				this.pcmInputWorklet.disconnect(this.inputDestination)
			} catch (e) {}

			this.inputDestination = null
		}

		return await window.ipcRenderer.invoke("sysaudio:stopCapture")
	}
}
