const pcmInputWorkletUrl = new URL("./worklets/pcm-input.js", import.meta.url)
	.href
const pcmOutputWorkletUrl = new URL("./worklets/pcm-output.js", import.meta.url)
	.href

export type AudioFrame = {
	buffer: Uint8Array
	sampleRate: number
	channels: number
	bitsPerSample: number
}

export type OutputTarget = {
	context: AudioContext
	destination: AudioNode
}

// common state shared by the legacy ipc transport and the shared memory
// transport. subclasses only implement the capture lifecycle
export abstract class SysAudioCaptureBase {
	inputCtx: AudioContext | null = null
	outputCtx: AudioContext | null = null
	outputBus: GainNode | null = null

	protected listeners = new Set<() => void>()

	abstract get supported(): boolean

	isSupported(): boolean {
		return this.supported
	}

	subscribe(listener: () => void) {
		this.listeners.add(listener)

		return () => {
			this.listeners.delete(listener)
		}
	}

	protected notify() {
		for (const listener of this.listeners) {
			listener()
		}
	}

	get outputActive() {
		return !!this.outputCtx && !!this.outputBus
	}

	outputTarget(): OutputTarget | null {
		if (!this.outputCtx || !this.outputBus) return null

		return { context: this.outputCtx, destination: this.outputBus }
	}

	abstract initialize(): Promise<void>
	abstract start(): Promise<MediaStreamTrack | null>
	abstract stop(): Promise<void>
}

export { pcmInputWorkletUrl, pcmOutputWorkletUrl }
