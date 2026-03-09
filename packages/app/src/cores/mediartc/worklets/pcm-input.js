class PCMInputProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
		this.queue = []
		this.readOffset = 0
		this.isPlaying = false

		this.port.onmessage = (event) => {
			this.queue.push(new Float32Array(event.data))
		}
	}

	process(_, outputs) {
		const output = outputs[0]
		const channelL = output[0]
		const channelR = output[1] || output[0]
		const framesNeeded = channelL.length

		if (!this.isPlaying) {
			if (this.queue.length > 3) {
				this.isPlaying = true
			} else {
				return true
			}
		}

		let framesWritten = 0

		while (framesWritten < framesNeeded && this.queue.length > 0) {
			const currentBlock = this.queue[0]

			const availableFramesInBlock =
				(currentBlock.length - this.readOffset) / 2
			const framesToTake = Math.min(
				framesNeeded - framesWritten,
				availableFramesInBlock,
			)

			for (let i = 0; i < framesToTake; i++) {
				channelL[framesWritten + i] = currentBlock[this.readOffset++]
				channelR[framesWritten + i] = currentBlock[this.readOffset++]
			}

			framesWritten += framesToTake

			if (this.readOffset >= currentBlock.length) {
				this.queue.shift()
				this.readOffset = 0
			}
		}

		if (this.queue.length === 0) {
			this.isPlaying = false
		}

		return true
	}
}

registerProcessor("pcm-input", PCMInputProcessor)
