export default class AudioProcessor {
	constructor(core, params = {}) {
		this.core = core
		this.params = params

		this.context = new AudioContext({
			sampleRate: 44100,
			latencyHint: "interactive",
			sinkId: params.sinkId,
		})

		if (this.params.stream) {
			this.sourceNode = this.context.createMediaStreamSource(
				this.params.stream,
			)
			this.destinationNode = this.context.createMediaStreamDestination()
		} else {
			this.destinationNode = this.context.destination
		}

		this.mainNode = this.context.createGain()
	}

	async initialize() {
		if (this.params.noiseGate) {
			await this.context.audioWorklet.addModule("/worklets/noisegate.js")

			this.noiseGateProccesor = new AudioWorkletNode(
				this.context,
				"noisegate",
				{
					parameterData: {
						threshold: parseInt(
							this.params.noiseGate.threshold ?? -40,
						),
						attack: parseFloat(
							this.params.noiseGate.attack ?? 0.03,
						),
						release: parseFloat(
							this.params.noiseGate.release ?? 0.01,
						),
					},
				},
			)
		}

		if (this.sourceNode) {
			this.sourceNode.connect(this.mainNode)
		}

		if (this.noiseGateProccesor) {
			this.mainNode.connect(this.noiseGateProccesor)
			this.noiseGateProccesor.connect(this.destinationNode)
		} else {
			this.mainNode.connect(this.destinationNode)
		}

		if (this.context.state === "suspended") {
			this.context.resume()
		}
	}

	async destroy() {
		this.context.close()
	}
}
