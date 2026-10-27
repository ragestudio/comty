const pcmInputWorkletUrl = new URL("./worklets/pcm-input.js", import.meta.url)
	.href
const pcmOutputWorkletUrl = new URL("./worklets/pcm-output.js", import.meta.url)
	.href

type AudioFrame = {
	buffer: Uint8Array
	sampleRate: number
	channels: number
	bitsPerSample: number
}

type OutputTarget = {
	context: AudioContext
	destination: AudioNode
}

// electron only: captures the system loopback through the native addon (pcm
// frames over ipc) and routes remote audio back through it to avoid feedback.
// mirrors the legacy mediartc sysaudio implementation
class SysAudioCapture {
	inputCtx: AudioContext | null = null
	outputCtx: AudioContext | null = null
	outputBus: GainNode | null = null

	pcmInputWorklet: AudioWorkletNode | null = null
	pcmOutputWorklet: AudioWorkletNode | null = null
	inputDestination: MediaStreamAudioDestinationNode | null = null

	private readyForFrames = false
	private resolveFirstFrame: ((frame: AudioFrame) => void) | null = null
	private pendingFrames: AudioFrame[] = []
	private ipcListening = false
	private listeners = new Set<() => void>()

	private get ipc() {
		if (typeof window === "undefined") return null

		return (window as Window & { ipcRenderer?: any }).ipcRenderer ?? null
	}

	get supported() {
		return (
			!!this.ipc &&
			typeof AudioContext !== "undefined" &&
			typeof navigator !== "undefined"
		)
	}

	get outputActive() {
		return !!this.outputCtx && !!this.pcmOutputWorklet
	}

	subscribe(listener: () => void) {
		this.listeners.add(listener)

		return () => {
			this.listeners.delete(listener)
		}
	}

	private notify() {
		for (const listener of this.listeners) {
			listener()
		}
	}

	outputTarget(): OutputTarget | null {
		if (!this.outputCtx || !this.outputBus) return null

		return { context: this.outputCtx, destination: this.outputBus }
	}

	async initialize() {
		if (!this.supported) return

		await this.initializeInput()

		const outputSupported = await this.ipc.invoke(
			"sysaudio:output_supported",
		)

		if (outputSupported) {
			await this.initializeOutput()
			this.notify()
		}
	}

	private async initializeInput() {
		if (this.inputCtx) return

		this.inputCtx = new AudioContext({
			sampleRate: 44100,
			latencyHint: "interactive",
		})

		await this.inputCtx.audioWorklet.addModule(pcmInputWorkletUrl)

		this.createInputWorklet()
		this.attachIpcListener()
	}

	private createInputWorklet() {
		if (!this.inputCtx) return

		this.pcmInputWorklet = new AudioWorkletNode(
			this.inputCtx,
			"pcm-input",
			{ outputChannelCount: [2] },
		)
	}

	private attachIpcListener() {
		if (this.ipcListening || !this.ipc) return

		this.ipcListening = true

		this.ipc.on("sysaudio:input", (_event: unknown, data: AudioFrame) => {
			if (!this.readyForFrames) {
				if (this.resolveFirstFrame) {
					this.resolveFirstFrame(data)
					this.resolveFirstFrame = null
				} else {
					// buffer frames that arrive during the context setup
					this.pendingFrames.push(data)
				}

				return
			}

			this.postFrame(data)
		})
	}

	private postFrame(frame: AudioFrame) {
		if (!this.pcmInputWorklet) return

		this.pcmInputWorklet.port.postMessage(frame, [frame.buffer.buffer])
	}

	private async rebuildInputContext(sampleRate: number) {
		if (this.pcmInputWorklet) {
			this.pcmInputWorklet.disconnect()
			this.pcmInputWorklet = null
		}

		if (this.inputCtx) {
			await this.inputCtx.close()
		}

		this.inputCtx = new AudioContext({
			sampleRate,
			latencyHint: "interactive",
		})

		await this.inputCtx.audioWorklet.addModule(pcmInputWorkletUrl)

		this.createInputWorklet()
	}

	private async initializeOutput() {
		if (!this.ipc) return

		const outputSupported = await this.ipc.invoke(
			"sysaudio:output_supported",
		)

		if (!outputSupported) return

		this.outputCtx = new AudioContext({
			sampleRate: 44100,
			latencyHint: "interactive",
		})

		await this.outputCtx.audioWorklet.addModule(pcmOutputWorkletUrl)

		this.outputBus = this.outputCtx.createGain()
		this.outputBus.gain.value = 1

		this.pcmOutputWorklet = new AudioWorkletNode(
			this.outputCtx,
			"pcm-output",
		)

		this.outputBus.connect(this.pcmOutputWorklet)

		this.pcmOutputWorklet.port.onmessage = (event) => {
			const buffer = new Uint8Array(event.data)

			this.ipc?.send("sysaudio:output", buffer, {
				sampleRate: this.outputCtx?.sampleRate ?? 44100,
				bitsPerSample: 16,
				channels: 2,
			})
		}

		// keep the worklet pulling even when nothing is connected to it
		const silence = this.outputCtx.createGain()
		silence.gain.value = 0

		this.pcmOutputWorklet.connect(silence)
		silence.connect(this.outputCtx.destination)
	}

	async isSupported() {
		return this.supported
	}

	async start(): Promise<MediaStreamTrack | null> {
		if (!this.supported) return null

		await this.initializeInput()

		this.readyForFrames = false
		this.pendingFrames = []

		const firstFrame = new Promise<AudioFrame>((resolve) => {
			this.resolveFirstFrame = resolve
		})

		await this.ipc.invoke("sysaudio:startCapture")

		const frame = await firstFrame
		const targetSampleRate = frame.sampleRate || 44100

		if (this.inputCtx!.sampleRate !== targetSampleRate) {
			await this.rebuildInputContext(targetSampleRate)
		}

		if (this.inputDestination) {
			try {
				this.pcmInputWorklet?.disconnect(this.inputDestination)
			} catch {
				// already disconnected
			}

			this.inputDestination.stream
				.getTracks()
				.forEach((track) => track.stop())

			this.inputDestination = null
		}

		this.inputDestination = this.inputCtx!.createMediaStreamDestination()
		this.inputDestination.channelCountMode = "explicit"
		this.inputDestination.channelCount = 2

		this.pcmInputWorklet!.connect(this.inputDestination)

		this.readyForFrames = true

		for (const pending of this.pendingFrames) {
			this.postFrame(pending)
		}

		this.pendingFrames = []

		await this.inputCtx!.resume().catch(() => {})

		return this.inputDestination.stream.getAudioTracks()[0] ?? null
	}

	async stop(): Promise<void> {
		this.readyForFrames = false
		this.pendingFrames = []

		if (this.inputDestination) {
			this.inputDestination.stream.getTracks().forEach((track) => {
				track.stop()
			})

			try {
				this.pcmInputWorklet?.disconnect(this.inputDestination)
			} catch {
				// already disconnected
			}

			this.inputDestination = null
		}

		await this.ipc?.invoke("sysaudio:stopCapture")
	}
}

export const sysAudio = new SysAudioCapture()

export default sysAudio
