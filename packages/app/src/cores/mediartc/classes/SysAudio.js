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

	isReadyForFrames = false
	resolveFirstFrame = null

	initialize = async () => {
		await this.initializeInput()

		if (await window.ipcRenderer.invoke("sysaudio:output_supported")) {
			await this.initializeOutput()
		}
	}

	initializeInput = async () => {
		await this.inputCtx.audioWorklet.addModule(
			new URL("../worklets/pcm-input.js", import.meta.url),
		)

		this.pcmInputWorklet = new AudioWorkletNode(
			this.inputCtx,
			"pcm-input",
			{ outputChannelCount: [2] },
		)

		window.ipcRenderer.on("sysaudio:input", (_, data) => {
			if (!this.isReadyForFrames) {
				if (this.resolveFirstFrame) {
					this.resolveFirstFrame(data)
					this.resolveFirstFrame = null
				}

				return
			}

			if (!this.pcmInputWorklet) return

			this.pcmInputWorklet.port.postMessage(data, [data.buffer.buffer])
		})
	}

	_rebuildInputContext = async (newSampleRate) => {
		console.warn(
			`[SysAudio] Updating AudioContext to match samplerate [${newSampleRate}Hz]`,
		)

		if (this.pcmInputWorklet) {
			this.pcmInputWorklet.disconnect()
			this.pcmInputWorklet = null
		}

		if (this.inputCtx) {
			await this.inputCtx.close()
		}

		this.inputCtx = new AudioContext({
			sampleRate: newSampleRate,
			latencyHint: "interactive",
		})

		await this.inputCtx.audioWorklet.addModule(
			new URL("../worklets/pcm-input.js", import.meta.url),
		)

		this.pcmInputWorklet = new AudioWorkletNode(
			this.inputCtx,
			"pcm-input",
			{ outputChannelCount: [2] },
		)
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
		this.isReadyForFrames = false

		const firstFramePromise = new Promise((resolve) => {
			this.resolveFirstFrame = resolve
		})

		await window.ipcRenderer.invoke("sysaudio:startCapture")

		const firstFrame = await firstFramePromise
		const targetSampleRate = firstFrame.format?.sampleRate || 44100

		if (this.inputCtx.sampleRate !== targetSampleRate) {
			await this._rebuildInputContext(targetSampleRate)
		}

		if (this.inputDestination) {
			try {
				this.pcmInputWorklet.disconnect(this.inputDestination)
			} catch (e) {}
		}

		this.inputDestination = this.inputCtx.createMediaStreamDestination()
		this.inputDestination.channelCountMode = "explicit"
		this.inputDestination.channelCount = 2

		this.pcmInputWorklet.connect(this.inputDestination)

		this.isReadyForFrames = true

		return this.audioInputTrack
	}

	stopCapture = async () => {
		this.isReadyForFrames = false

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
