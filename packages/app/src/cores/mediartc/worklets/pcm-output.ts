class PCMOutputProcessor extends AudioWorkletProcessor {
	private bufferSize: number
	private interleaved: Int16Array
	private writeIndex: number

	constructor(options?: AudioWorkletNodeOptions) {
		super()

		this.bufferSize = options?.processorOptions?.bufferSize || 256
		this.interleaved = new Int16Array(this.bufferSize * 2)
		this.writeIndex = 0
	}

	process(
		inputs: Float32Array[][],
		outputs: Float32Array[][],
		parameters: Record<string, Float32Array>,
	): boolean {
		const input = inputs[0]

		if (!input || input.length === 0) {
			return true
		}

		const isSilent = !input || input.length === 0
		const left: Float32Array | null = isSilent ? null : input[0]
		const right: Float32Array | null = isSilent
			? null
			: input.length > 1
				? input[1]
				: input[0]

		const length = left.length

		for (let i = 0; i < length; i++) {
			let sL = Math.max(-1, Math.min(1, left[i]))
			let sR = Math.max(-1, Math.min(1, right[i]))

			this.interleaved[this.writeIndex * 2] =
				sL < 0 ? sL * 0x8000 : sL * 0x7fff
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
