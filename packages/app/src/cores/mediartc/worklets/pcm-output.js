class PCMOutputProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
		this.bufferSize = 4096
		this.interleaved = new Int16Array(this.bufferSize * 2)
		this.writeIndex = 0
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0]

		if (!input || input.length === 0) {
			return true
		}

		const left = input[0]
		const right = input.length > 1 ? input[1] : input[0]
		const length = left.length

		for (let i = 0; i < length; i++) {
			let sL = Math.max(-1, Math.min(1, left[i]))

			this.interleaved[this.writeIndex * 2] =
				sL < 0 ? sL * 0x8000 : sL * 0x7fff

			let sR = Math.max(-1, Math.min(1, right[i]))
			this.interleaved[this.writeIndex * 2 + 1] =
				sR < 0 ? sR * 0x8000 : sR * 0x7fff

			this.writeIndex++

			if (this.writeIndex >= this.bufferSize) {
				const outBuffer = this.interleaved.slice().buffer

				this.port.postMessage(outBuffer, [outBuffer])
				this.writeIndex = 0
			}
		}

		return true
	}
}

registerProcessor("pcm-output", PCMOutputProcessor)
