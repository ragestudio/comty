import ProcessorNode from "../node"

export default class GainProcessorNode extends ProcessorNode {
	static refName = "gain"
	static gradualFadeMs = 150

	exposeToPublic = {
		set: this.setGain.bind(this),
		linearRampToValueAtTime: this.linearRampToValueAtTime.bind(this),
		fade: this.fade.bind(this),
	}

	setGain(gain) {
		gain = this.processGainValue(gain)

		return (this.processor.gain.value = gain)
	}

	linearRampToValueAtTime(gain, time) {
		gain = this.processGainValue(gain)
		return this.processor.gain.linearRampToValueAtTime(gain, time)
	}

	fade(gain) {
		if (gain <= 0) {
			gain = 0.0001
		} else {
			gain = this.processGainValue(gain)
		}

		const currentTime = this.audioContext.currentTime
		const fadeTime = currentTime + this.constructor.gradualFadeMs / 1000

		this.processor.gain.linearRampToValueAtTime(gain, fadeTime)
	}

	processGainValue(gain) {
		return Math.pow(gain, 2)
	}

	async init() {
		if (!this.audioContext) {
			throw new Error("audioContext is required")
		}

		this.processor = this.audioContext.createGain()
		this.processor.gain.value = this.player.state.volume
	}
}
