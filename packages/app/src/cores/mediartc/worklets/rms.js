const QUANTUM_SIZE = 128

class AudioRMS extends AudioWorkletProcessor {
	constructor() {
		super()
		this._volume = 0
		this._updateIntervalInMS = 25
		this._nextUpdateFrame = this._updateIntervalInMS
	}

	static get parameterDescriptors() {
		return [
			{ name: "clipLevel", defaultValue: 0.98 },
			{ name: "averaging", defaultValue: 0.95 },
			{ name: "clipLag", defaultValue: 750 },
		]
	}

	get intervalInFrames() {
		return (this._updateIntervalInMS / 1000) * sampleRate
	}

	process(inputs, outputs, parameters) {
		const clipLevel = parameters.clipLevel[0]
		const averaging = parameters.averaging[0]
		const clipLag = parameters.clipLag[0]
		const input = inputs[0]

		const volumes = input.map((channel, id) => {
			const samples = channel

			let sum = 0
			let isClipping = false
			let lastClip = 0

			// Calculated the squared-sum.
			for (let i = 0; i < samples.length; ++i) {
				if (Math.abs(samples[i]) >= clipLevel) {
					isClipping = true
					lastClip = Date.now()
				}

				if (lastClip + clipLag < Date.now()) {
					isClipping = false
				}

				sum += samples[i] * samples[i]
			}

			// Calculate the RMS level and update the volume.
			const rms = Math.sqrt(sum / samples.length)

			// Now smooth this out with the averaging factor applied
			// to the previous sample - take the max here because we
			// want "fast attack, slow release."
			this._volume = Math.max(rms, this._volume * averaging)

			return { value: this._volume, clipping: isClipping }
		})

		// Update and sync the volume property with the main thread.
		this._nextUpdateFrame -= QUANTUM_SIZE

		if (this._nextUpdateFrame < 0) {
			this._nextUpdateFrame += this.intervalInFrames
			this.port.postMessage({
				volume: volumes,
			})
		}

		return true
	}
}

registerProcessor("audio-rms", AudioRMS)
