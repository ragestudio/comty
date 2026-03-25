import volumeGateWorkletUrl from "../worklets/volume-gate?worker&url"
import rnnoiseWorkletUrl from "@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url"

export default class AudioProcessor {
	constructor(core, params = {}) {
		this.core = core
		this.params = params

		this.context = new AudioContext({
			sampleRate: 48000,
			latencyHint: "interactive",
			sinkId: params.sinkId,
		})

		if (this.params.stream) {
			this.sourceNode = this.context.createMediaStreamSource(
				this.params.stream,
			)
			this.destinationNode = new MediaStreamAudioDestinationNode(
				this.context,
				{
					channelCount: this.params.channelCount ?? 2,
				},
			)
		} else {
			this.destinationNode = this.context.destination
		}

		this.mainNode = this.context.createGain()
	}

	lastNode = null

	async initialize() {
		await this.context.audioWorklet.addModule(volumeGateWorkletUrl)
		await this.context.audioWorklet.addModule(rnnoiseWorkletUrl)

		this.lastNode = this.mainNode

		if (this.sourceNode) {
			this.sourceNode.connect(this.mainNode)
			this.lastNode = this.mainNode
		}

		if (this.params.noiseSupression) {
			console.log("Enabling Noise Suppresion with RNNoise")

			this.noiseSuppresionProcessor = new AudioWorkletNode(
				this.context,
				"NoiseSuppressorWorklet",
			)

			this.lastNode.connect(this.noiseSuppresionProcessor)
			this.lastNode = this.noiseSuppresionProcessor
		}

		if (this.params.volumeGate) {
			this.volumeGateProcessor = new AudioWorkletNode(
				this.context,
				"volume-gate",
				{
					parameterData: {
						threshold: parseInt(
							this.params.volumeGate.threshold ?? -40,
						),
						attack: parseFloat(
							this.params.volumeGate.attack ?? 0.03,
						),
						release: parseFloat(
							this.params.volumeGate.release ?? 0.01,
						),
					},
				},
			)

			this.lastNode.connect(this.volumeGateProcessor)
			this.lastNode = this.volumeGateProcessor
		}

		this.lastNode.connect(this.destinationNode)

		if (this.context.state === "suspended") {
			this.context.resume()
		}
	}

	async destroy() {
		this.context.close()
	}
}
