// reads pcm frames directly from the shared capture ring written by the native
// addon. runs on the audio thread, no per-frame messages
const HEADER = {
	sampleRate: 2,
	channels: 3,
	bitsPerSample: 4,
	captureWrite: 6,
	captureRead: 7,
}

class PCMInputProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super()

		const { buffer, layout } = options.processorOptions

		this.header = new Int32Array(buffer, 0, layout.headerBytes / 4)
		this.bytes = new Uint8Array(
			buffer,
			layout.captureOffset,
			layout.captureCapacity,
		)
		this.s16 = new Int16Array(
			buffer,
			layout.captureOffset,
			layout.captureCapacity / 2,
		)
		this.f32 = new Float32Array(
			buffer,
			layout.captureOffset,
			layout.captureCapacity / 4,
		)

		this.mask = layout.captureCapacity - 1
		this.channels = 2
		this.bitsPerSample = 16

		this.primed = false
		this.preBufferFrames = 256
		this.maxBufferFrames = 4096
	}

	process(inputs, outputs) {
		const output = outputs[0]

		if (!output || output.length === 0) {
			return true
		}

		const framesNeeded = output[0].length
		const outputChannels = output.length

		const sampleRate = Atomics.load(this.header, HEADER.sampleRate)
		const channels = Atomics.load(this.header, HEADER.channels)

		if (sampleRate > 0 && channels > 0) {
			this.channels = channels
			this.bitsPerSample =
				Atomics.load(this.header, HEADER.bitsPerSample) || this.bitsPerSample
		}

		const bytesPerSample = this.bitsPerSample / 8
		const frameBytes = this.channels * bytesPerSample

		let read = Atomics.load(this.header, HEADER.captureRead)
		const write = Atomics.load(this.header, HEADER.captureWrite)
		let availableFrames = Math.floor(((write - read) >>> 0) / frameBytes)

		if (!this.primed) {
			if (availableFrames < this.preBufferFrames) {
				return true
			}

			this.primed = true
		}

		if (availableFrames < framesNeeded) {
			this.primed = false
			return true
		}

		// latency guard: drop excess instead of playing behind
		if (availableFrames > this.maxBufferFrames) {
			const skipFrames = availableFrames - this.maxBufferFrames
			read = (read + skipFrames * frameBytes) >>> 0
		}

		this.readFrames(
			read,
			framesNeeded,
			output,
			outputChannels,
			bytesPerSample,
			frameBytes,
		)

		read = (read + framesNeeded * frameBytes) >>> 0
		Atomics.store(this.header, HEADER.captureRead, read)

		return true
	}

	readFrames(read, frames, output, outputChannels, bytesPerSample, frameBytes) {
		const channels = this.channels

		if (this.bitsPerSample === 16) {
			const mask = this.s16.length - 1
			const base = (read >>> 1) & mask

			for (let i = 0; i < frames; i++) {
				const frameIndex = base + i * channels

				for (let c = 0; c < outputChannels; c++) {
					const sampleIndex = (frameIndex + (c % channels)) & mask

					output[c][i] = this.s16[sampleIndex] / 32768
				}
			}

			return
		}

		if (this.bitsPerSample === 32) {
			const mask = this.f32.length - 1
			const base = (read >>> 2) & mask

			for (let i = 0; i < frames; i++) {
				const frameIndex = base + i * channels

				for (let c = 0; c < outputChannels; c++) {
					const sampleIndex = (frameIndex + (c % channels)) & mask

					output[c][i] = this.f32[sampleIndex]
				}
			}

			return
		}

		// 8 and 24 bit fallback, reads byte by byte
		for (let i = 0; i < frames; i++) {
			for (let c = 0; c < outputChannels; c++) {
				const sampleOffset =
					(read + i * frameBytes + (c % channels) * bytesPerSample) & this.mask

				output[c][i] = this.readSample(sampleOffset, bytesPerSample)
			}
		}
	}

	readSample(offset, bytesPerSample) {
		if (bytesPerSample === 1) {
			return (this.bytes[offset] - 128) / 128
		}

		if (bytesPerSample === 3) {
			let value =
				this.bytes[offset] |
				(this.bytes[(offset + 1) & this.mask] << 8) |
				(this.bytes[(offset + 2) & this.mask] << 16)

			value = (value << 8) >> 8

			return value / 8388608
		}

		return 0
	}
}

registerProcessor("pcm-input", PCMInputProcessor)
