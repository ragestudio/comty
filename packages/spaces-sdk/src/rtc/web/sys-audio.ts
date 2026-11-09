import { keepContextRunning } from "./audio-context"
import {
	pcmInputWorkletUrl,
	pcmOutputWorkletUrl,
	SysAudioCaptureBase,
} from "./sys-audio-base"
import {
	HEADER_WORDS,
	SYSAUDIO_BRIDGE,
	SYSAUDIO_REQUEST,
	SharedWord,
	type AudioFormat,
	type BridgeControlRequest,
	type BridgeControlResponse,
	type SharedLayout,
	type SysAudioBridgeMessage,
	type SysAudioWindow,
} from "./sys-audio-layout"
import { SysAudioLegacyCapture } from "./sys-audio-legacy"

const CONNECT_TIMEOUT_MS = 4000
const CONTROL_TIMEOUT_MS = 3000
const FORMAT_TIMEOUT_MS = 1500
const FORMAT_POLL_MS = 10

interface BridgeState {
	buffer: SharedArrayBuffer
	layout: SharedLayout
	outputSupported: boolean
}

interface PendingRequest {
	resolve: (response: BridgeControlResponse) => void
	reject: (error: Error) => void
}

// electron only: the native addon runs in the preload and shares a
// SharedArrayBuffer with the worklets. the control channel is a MessagePort,
// audio never travels over electron ipc
export class SysAudioSharedCapture extends SysAudioCaptureBase {
	pcmInputWorklet: AudioWorkletNode | null = null
	pcmOutputWorklet: AudioWorkletNode | null = null
	inputDestination: MediaStreamAudioDestinationNode | null = null

	private bridge: BridgeState | null = null
	private header: Int32Array | null = null
	private port: MessagePort | null = null
	private connecting: Promise<void> | null = null
	private requestId = 1
	private pending = new Map<number, PendingRequest>()

	get supported() {
		if (typeof window === "undefined") return false
		if (typeof AudioContext === "undefined") return false

		return !!(window as SysAudioWindow).__SYS_AUDIO__?.available
	}

	async initialize(): Promise<void> {
		if (!this.supported) return

		await this.ensureBridge()
		await this.initializeInput()

		if (this.bridge?.outputSupported) {
			await this.initializeOutput()
			this.notify()
		}
	}

	async start(): Promise<MediaStreamTrack | null> {
		if (!this.supported) return null

		await this.initialize()
		await this.request("start-capture")

		const format = await this.waitForFormat()
		const targetSampleRate = format.sampleRate || 48000

		if (this.inputCtx!.sampleRate !== targetSampleRate) {
			await this.rebuildInputContext(targetSampleRate)
		}

		if (this.inputDestination) {
			try {
				this.pcmInputWorklet?.disconnect(this.inputDestination)
			} catch {
				// already disconnected
			}

			this.inputDestination.stream.getTracks().forEach((track) => track.stop())

			this.inputDestination = null
		}

		this.inputDestination = this.inputCtx!.createMediaStreamDestination()
		this.inputDestination.channelCountMode = "explicit"
		this.inputDestination.channelCount = 2

		this.pcmInputWorklet!.connect(this.inputDestination)

		await this.inputCtx!.resume().catch(() => {})

		return this.inputDestination.stream.getAudioTracks()[0] ?? null
	}

	async stop(): Promise<void> {
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

		await this.request("stop-capture").catch(() => {})
	}

	private ensureBridge(): Promise<void> {
		if (this.bridge && this.port) {
			return Promise.resolve()
		}

		if (!this.connecting) {
			this.connecting = this.connect().catch((error) => {
				this.connecting = null
				throw error
			})
		}

		return this.connecting
	}

	private connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			const timer = window.setTimeout(() => {
				cleanup()
				reject(new Error("sysaudio bridge timeout"))
			}, CONNECT_TIMEOUT_MS)

			const onMessage = (event: MessageEvent) => {
				if (event.source !== window) return

				const data = event.data as SysAudioBridgeMessage | undefined

				if (data?.type !== SYSAUDIO_BRIDGE) return

				const port = event.ports[0]

				if (!port) return

				cleanup()

				this.bridge = {
					buffer: data.buffer,
					layout: data.layout,
					outputSupported: !!data.outputSupported,
				}
				this.header = new Int32Array(data.buffer, 0, HEADER_WORDS)
				this.port = port
				this.port.onmessage = (messageEvent) => {
					this.onControlResponse(messageEvent.data as BridgeControlResponse)
				}
				this.port.start()

				resolve()
			}

			const cleanup = () => {
				window.clearTimeout(timer)
				window.removeEventListener("message", onMessage)
			}

			window.addEventListener("message", onMessage)
			window.postMessage({ type: SYSAUDIO_REQUEST, version: 1 }, "*")
		})
	}

	private onControlResponse(response: BridgeControlResponse): void {
		if (!response || typeof response.id !== "number") return

		const pending = this.pending.get(response.id)

		if (!pending) return

		this.pending.delete(response.id)

		if (!response.ok) {
			pending.reject(new Error(response.error ?? "sysaudio control error"))
			return
		}

		pending.resolve(response)
	}

	private request(
		type: BridgeControlRequest["type"],
	): Promise<BridgeControlResponse> {
		return new Promise((resolve, reject) => {
			if (!this.port) {
				reject(new Error("sysaudio control channel is not connected"))
				return
			}

			const id = this.requestId++
			const timer = window.setTimeout(() => {
				this.pending.delete(id)
				reject(new Error(`sysaudio control timeout: ${type}`))
			}, CONTROL_TIMEOUT_MS)

			this.pending.set(id, {
				resolve: (response) => {
					window.clearTimeout(timer)
					resolve(response)
				},
				reject: (error) => {
					window.clearTimeout(timer)
					reject(error)
				},
			})

			this.port.postMessage({ id, type } satisfies BridgeControlRequest)
		})
	}

	private readFormat(): AudioFormat {
		if (!this.header) {
			return { sampleRate: 0, channels: 0, bitsPerSample: 0 }
		}

		return {
			sampleRate: Atomics.load(this.header, SharedWord.SampleRate),
			channels: Atomics.load(this.header, SharedWord.Channels),
			bitsPerSample: Atomics.load(this.header, SharedWord.BitsPerSample),
			format: Atomics.load(this.header, SharedWord.Format),
		}
	}

	private async waitForFormat(): Promise<AudioFormat> {
		if (!this.header) {
			return { sampleRate: 0, channels: 0, bitsPerSample: 16 }
		}

		const started = performance.now()

		while (performance.now() - started < FORMAT_TIMEOUT_MS) {
			if (Atomics.load(this.header, SharedWord.SampleRate) > 0) {
				return this.readFormat()
			}

			await new Promise((resolve) => setTimeout(resolve, FORMAT_POLL_MS))
		}

		return {
			sampleRate: this.inputCtx?.sampleRate ?? 48000,
			channels: 2,
			bitsPerSample: 16,
		}
	}

	private async initializeInput(sampleRate = 48000): Promise<void> {
		if (this.inputCtx) return

		this.inputCtx = new AudioContext({
			sampleRate,
			latencyHint: "interactive",
		})

		await this.inputCtx.audioWorklet.addModule(pcmInputWorkletUrl)

		this.createInputWorklet()
	}

	private createInputWorklet(): void {
		if (!this.inputCtx || !this.bridge) return

		this.pcmInputWorklet = new AudioWorkletNode(this.inputCtx, "pcm-input", {
			outputChannelCount: [2],
			processorOptions: {
				buffer: this.bridge.buffer,
				layout: this.bridge.layout,
			},
		})
	}

	private async rebuildInputContext(sampleRate: number): Promise<void> {
		if (this.pcmInputWorklet) {
			this.pcmInputWorklet.disconnect()
			this.pcmInputWorklet = null
		}

		if (this.inputCtx) {
			await this.inputCtx.close()
		}

		this.inputCtx = null

		await this.initializeInput(sampleRate)
	}

	private async initializeOutput(): Promise<void> {
		if (this.outputCtx || !this.bridge?.outputSupported) return

		// the native output stream runs at 44100 s16 stereo
		this.outputCtx = new AudioContext({
			sampleRate: 44100,
			latencyHint: "interactive",
		})

		await this.outputCtx.audioWorklet.addModule(pcmOutputWorkletUrl)

		this.outputBus = this.outputCtx.createGain()
		this.outputBus.gain.value = 1

		// the output context is created before any gesture, so keep it unlocked
		keepContextRunning(this.outputCtx)

		this.pcmOutputWorklet = new AudioWorkletNode(this.outputCtx, "pcm-output", {
			processorOptions: {
				buffer: this.bridge.buffer,
				layout: this.bridge.layout,
			},
		})

		this.outputBus.connect(this.pcmOutputWorklet)

		// keep the worklet pulling even when nothing is connected to it
		const silence = this.outputCtx.createGain()
		silence.gain.value = 0

		this.pcmOutputWorklet.connect(silence)
		silence.connect(this.outputCtx.destination)
	}
}

class SysAudioUnsupported extends SysAudioCaptureBase {
	get supported() {
		return false
	}

	async initialize(): Promise<void> {}

	async start(): Promise<MediaStreamTrack | null> {
		return null
	}

	async stop(): Promise<void> {}
}

function createSysAudioCapture(): SysAudioCaptureBase {
	if (typeof window === "undefined") {
		return new SysAudioUnsupported()
	}

	const target = window as SysAudioWindow

	if (target.__SYS_AUDIO__?.available) {
		return new SysAudioSharedCapture()
	}

	if (target.ipcRenderer) {
		return new SysAudioLegacyCapture()
	}

	return new SysAudioUnsupported()
}

export const sysAudio = createSysAudioCapture()

export default sysAudio
