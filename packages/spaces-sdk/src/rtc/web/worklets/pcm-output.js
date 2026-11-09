// writes interleaved s16 stereo into the shared playback ring read by the
// native output stream. runs on the audio thread, no per-frame messages
const PLAYBACK_WRITE = 8
const PLAYBACK_READ = 9

class PCMOutputProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super()

		const { buffer, layout } = options.processorOptions

		this.header = new Int32Array(buffer, 0, layout.headerBytes / 4)
		this.capacity = layout.playbackCapacity
		this.samples = new Int16Array(
			buffer,
			layout.playbackOffset,
			layout.playbackCapacity / 2,
		)
		this.sampleMask = this.samples.length - 1
	}

	process(inputs) {
		const input = inputs[0]

		if (!input || input.length === 0 || !input[0]) {
			return true
		}

		const left = input[0]
		const right = input[1] ?? input[0]
		const frames = left.length
		const bytesNeeded = frames * 4

		const write = Atomics.load(this.header, PLAYBACK_WRITE)
		const read = Atomics.load(this.header, PLAYBACK_READ)
		const available = this.capacity - ((write - read) >>> 0)

		if (available < bytesNeeded) {
			return true
		}

		let sampleIndex = (write >>> 1) & this.sampleMask

		for (let i = 0; i < frames; i++) {
			const leftSample = Math.max(-1, Math.min(1, left[i]))
			const rightSample = Math.max(-1, Math.min(1, right[i]))

			this.samples[sampleIndex] =
				leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7fff
			this.samples[(sampleIndex + 1) & this.sampleMask] =
				rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7fff

			sampleIndex = (sampleIndex + 2) & this.sampleMask
		}

		Atomics.store(this.header, PLAYBACK_WRITE, (write + bytesNeeded) >>> 0)

		return true
	}
}

registerProcessor("pcm-output", PCMOutputProcessor)
