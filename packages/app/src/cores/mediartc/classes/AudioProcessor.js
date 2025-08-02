export default class AudioProcessor {
	constructor(core, params = {}) {
		this.core = core
		this.params = params

		this.context = new AudioContext({
			sampleRate: 44100,
			latencyHint: "interactive",
			sinkId: params.sinkId,
		})

		this.mainNode = this.context.createGain()
		this.analyserNode = this.context.createAnalyser({
			fftSize: 1024,
		})

		this.mainNode.connect(this.analyserNode)
		this.analyserNode.connect(this.context.destination)
	}
}
