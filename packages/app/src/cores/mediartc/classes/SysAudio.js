export default class SysAudio {
	constructor() {
		if (!window.ipcRenderer) {
			throw new Error("SysAudio requires ipcRenderer")
		}
		if (!window.AudioContext) {
			throw new Error("SysAudio requires AudioContext")
		}
	}

	get audioTrack() {
		if (!this.destination) {
			return null
		}

		return this.destination.stream.getAudioTracks()[0]
	}

	ctx = new AudioContext({
		sampleRate: 48000,
		latencyHint: "interactive",
	})
	pcmInputWorklet = null
	destination = null

	initialize = async () => {
		await this.ctx.audioWorklet.addModule(
			new URL("../worklets/pcm-input.js", import.meta.url),
		)

		this.pcmInputWorklet = new AudioWorkletNode(this.ctx, "pcm-input", {
			outputChannelCount: [2],
		})
		this.destination = this.ctx.createMediaStreamDestination()

		this.destination.channelCountMode = "explicit"
		this.destination.channelCount = 2

		this.pcmInputWorklet.connect(this.destination)

		window.ipcRenderer.on("desktopcapturer:sysaudio-buff", (_, data) => {
			this.pcmInputWorklet.port.postMessage(data.buffer, [data.buffer])
		})
	}

	startCapture = async () => {
		await window.ipcRenderer.invoke(
			"desktopcapturer:startSystemAudioCapture",
		)

		return this.audioTrack
	}

	stopCapture = async () => {
		return await window.ipcRenderer.invoke(
			"desktopcapturer:stopSystemAudioCapture",
		)
	}
}
