class PCMInputProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
		this.ringBufferSize = 1048576
		this.mask = this.ringBufferSize - 1
		this.ringBuffer = new Float32Array(this.ringBufferSize)

		this.writeOffset = 0
		this.readOffset = 0
		this.availableSamples = 0
		this.isPlaying = false

		this.channels = 2
		this.bitsPerSample = 16
		this.preBuffer = 3072

		this.port.onmessage = (event) => {
			const { buffer, sampleRate, channels, bitsPerSample } = event.data

			if (buffer) {
				this.channels = channels || this.channels
				this.bitsPerSample = bitsPerSample || this.bitsPerSample

				this.processIncomingData(buffer)
			}
		}
	}

	processIncomingData(buffer) {
		const arrayBuffer = buffer.buffer || buffer
		const byteOffset = buffer.byteOffset || 0
		const byteLength = buffer.byteLength

		let view

		switch (this.bitsPerSample) {
			case 16:
				view = new Int16Array(arrayBuffer, byteOffset, byteLength / 2)

				for (let i = 0; i < view.length; i++) {
					this._writeSample(view[i] / 32768.0)
				}

				break

			case 8:
				view = new Uint8Array(arrayBuffer, byteOffset, byteLength)

				for (let i = 0; i < view.length; i++) {
					this._writeSample((view[i] - 128) / 128.0)
				}

				break

			case 24:
				view = new Uint8Array(arrayBuffer, byteOffset, byteLength)

				for (let i = 0; i < view.length; i += 3) {
					let int32 =
						view[i] | (view[i + 1] << 8) | (view[i + 2] << 16)

					int32 = (int32 << 8) >> 8
					this._writeSample(int32 / 8388608.0)
				}
				break

			case 32:
				view = new Float32Array(arrayBuffer, byteOffset, byteLength / 4)

				for (let i = 0; i < view.length; i++) {
					this._writeSample(view[i])
				}
				break
		}
	}

	_writeSample(sample) {
		this.ringBuffer[this.writeOffset] = sample
		this.writeOffset = (this.writeOffset + 1) & this.mask

		if (this.availableSamples < this.ringBufferSize) {
			this.availableSamples++
		} else {
			this.readOffset = (this.readOffset + 1) & this.mask
		}
	}

	process(inputs, outputs) {
		const output = outputs[0]
		const channelsNeeded = output.length
		const framesNeeded = output[0].length
		const inputChannels = this.channels
		const samplesNeeded = framesNeeded * inputChannels

		if (!this.isPlaying) {
			if (this.availableSamples >= inputChannels * this.preBuffer) {
				this.isPlaying = true
			} else {
				return true
			}
		}

		if (this.availableSamples < samplesNeeded) {
			this.isPlaying = false
			return true
		}

		for (let i = 0; i < framesNeeded; i++) {
			for (let c = 0; c < channelsNeeded; c++) {
				const inputChannel = c % inputChannels
				const sampleIndex = (this.readOffset + inputChannel) & this.mask

				output[c][i] = this.ringBuffer[sampleIndex]
			}

			this.readOffset = (this.readOffset + inputChannels) & this.mask
			this.availableSamples -= inputChannels
		}

		return true
	}
}

registerProcessor("pcm-input", PCMInputProcessor)
