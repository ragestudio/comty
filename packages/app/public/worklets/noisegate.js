function toDecibel(powerLevel) {
	return 10 * Math.log10(powerLevel)
}

function getAlphaFromTimeConstant(timeConstant, sampleRate) {
	return Math.exp(-1 / (sampleRate * timeConstant))
}

class NoiseGateProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{
				name: "threshold",
				defaultValue: -100,
				minValue: -100,
				maxValue: 0,
			},
			{ name: "attack", defaultValue: 0, minValue: 0, maxValue: 1 },
			{ name: "release", defaultValue: 0, minValue: 0, maxValue: 1 },
		]
	}

	constructor(options) {
		super()

		this.previousLevel = 0
		this.previousWeight = 1.0

		const timeConstant = options?.processorOptions?.timeConstant ?? 0.0025
		this.alpha = getAlphaFromTimeConstant(timeConstant, sampleRate)
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0]
		const output = outputs[0]

		const threshold = parameters.threshold[0]
		const attack = parameters.attack[0]
		const release = parameters.release[0]

		if (input.length === 0) {
			return true
		}

		for (let channel = 0; channel < output.length; ++channel) {
			const inputChannel = input[channel]
			const outputChannel = output[channel]

			let envelope = 0
			let weight = 0

			let attackSteps = 1
			let releaseSteps = 1
			let attackLossPerStep = 1
			let releaseGainPerStep = 1

			if (attack > 0) {
				attackSteps = Math.ceil(sampleRate * attack)
				attackLossPerStep = 1 / attackSteps
			}
			if (release > 0) {
				releaseSteps = Math.ceil(sampleRate * release)
				releaseGainPerStep = 1 / releaseSteps
			}

			for (let i = 0; i < inputChannel.length; ++i) {
				const inputSample = inputChannel[i]

				const inputSquare = inputSample * inputSample

				envelope =
					this.alpha * this.previousLevel +
					(1 - this.alpha) * inputSquare

				this.previousLevel = envelope

				const scaledEnvelopeValue = toDecibel(2 * envelope)

				if (scaledEnvelopeValue < threshold) {
					weight = this.previousWeight - attackLossPerStep
				} else {
					weight = this.previousWeight + releaseGainPerStep
				}

				weight = Math.max(0, Math.min(1, weight))

				this.previousWeight = weight

				outputChannel[i] = inputSample * weight
			}
		}

		return true
	}
}

registerProcessor("noisegate", NoiseGateProcessor)
