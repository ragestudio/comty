import MediaRTC from "../mediartc.core"
import AudioProcessor from "./AudioProcessor"
import SysAudio from "./SysAudio"

import defaults from "../defaults"

import type { Producer } from "./Producers"

type CreateScreenStreamOptions = {
	resolution?: { width: number; height: number }
	framerate?: number
	systemAudio?: boolean
}

export default class Self {
	constructor(core: MediaRTC) {
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	core: MediaRTC

	micStream: MediaStream = null
	micProducer: Producer = null

	camStream: MediaStream = null
	camProducer: Producer = null

	screenStream: MediaStream = null
	screenProducer: Producer = null
	screenAudioProducer: Producer = null

	audioInput = null
	audioOutput =
		!app.isDesktop &&
		new AudioProcessor(this, {
			sinkId: Self.outputDeviceId,
		})
	sysAudio = app.isDesktop && new SysAudio()

	get isMuted() {
		return this.micStream ? !this.micStream.getTracks()[0].enabled : false
	}

	get isDeafened() {
		if (this.sysAudio) {
			if (this.sysAudio.outputBus) {
				return this.sysAudio.outputBus.gain.value === 0
			}
		}

		return this.audioOutput?.context?.state === "suspended"
	}

	get audioSettings() {
		return {
			noiseSuppression:
				app.cores.settings.get("mediartc:noiseSuppression") ?? "native",
			echoCancellation:
				app.cores.settings.get("mediartc:echoCancellation") ?? true,
			autoGain: app.cores.settings.get("mediartc:autoGain") ?? false,
			volumeGateThreshold:
				app.cores.settings.get("mediartc:volumeGateThreshold") ?? "-40",
			inputGain: app.cores.settings.get("mediartc:inputGain") ?? "1.0",
			outputGain: app.cores.settings.get("mediartc:outputGain") ?? "1.0",
		}
	}

	set audioSettings(update) {
		if (!update) {
			return
		}

		let shouldRestartMic = false

		for (const [key, value] of Object.entries(update)) {
			this.core.console.log("setting audio setting", key, value)

			if (key === "volumeGateThreshold") {
				app.cores.settings.set("mediartc:volumeGateThreshold", value)

				if (this.audioInput?.volumeGateProcessor) {
					this.audioInput.volumeGateProcessor.parameters.get(
						"threshold",
					).value = value
				}
			}

			if (key === "inputGain") {
				app.cores.settings.set("mediartc:inputGain", value)

				if (this.audioInput && this.audioInput?.mainNode) {
					this.audioInput.mainNode.gain.value = value
				}
			}

			if (key === "outputGain") {
				app.cores.settings.set("mediartc:outputGain", value)

				if (this.audioOutput && this.audioOutput?.mainNode) {
					this.audioOutput.mainNode.gain.value = value
				}
			}

			if (key === "echoCancellation") {
				app.cores.settings.set("mediartc:echoCancellation", value)

				this.updateMicStreamConstraints({
					echoCancellation: value,
				})
			}

			if (key === "autoGainControl") {
				app.cores.settings.set("mediartc:autoGainControl", value)

				this.updateMicStreamConstraints({
					autoGainControl: value,
				})
			}

			if (key === "noiseSuppression") {
				app.cores.settings.set("mediartc:noiseSuppression", value)

				shouldRestartMic = true
			}
		}

		if (shouldRestartMic) {
			this.restartMic()
		}
	}

	static get inputDeviceId() {
		return app.cores.settings.get("mediartc:input_device")
	}

	static get outputDeviceId() {
		return app.cores.settings.get("mediartc:output_device")
	}

	async restartMic() {
		if (this.micStream) {
			await this.destroyMicStream()
			await this.createMicStream()
		}

		if (this.micProducer) {
			await this.stopMicProducer()
			await this.startMicProducer()
		}
	}

	async changeMicOutgoingBitrate(bitrate: number) {
		if (!this.micProducer) {
			this.core.console.warn(
				"Cannot change mic outgoing bitrate due is no currently producing",
			)
			return null
		}

		const parameters = this.micProducer.rtpSender.getParameters()

		if (!parameters.encodings || parameters.encodings.length === 0) {
			return
		}

		parameters.encodings[0].maxBitrate = bitrate

		return await this.micProducer.rtpSender.setParameters(parameters)
	}

	async updateMicStreamConstraints(constraints = {}) {
		if (!this.micStream) {
			return null
		}

		const micTrack = this.micStream.getAudioTracks()[0]

		const updatedConstraints = {
			...micTrack.getSettings(),
			...micTrack.getConstraints(),
			...constraints,
		}

		console.log("update mic stream constraints", updatedConstraints)

		micTrack.applyConstraints(updatedConstraints)
	}

	async createMicStream() {
		if (this.micStream) {
			this.micStream.getTracks().forEach((track) => track.stop())
		}

		const params = {
			audio: {
				deviceId: {
					exact: Self.inputDeviceId,
				},
				echoCancellation: this.audioSettings.echoCancellation,
				noiseSuppression:
					this.audioSettings.noiseSuppression === "native",
				autoGainControl: this.audioSettings.autoGain,
				sampleRate: 48000,
				channelCount: 1,
			},
		}

		this.core.console.debug("Creating mic stream", {
			params,
			audioSettings: this.audioSettings,
		})

		this.micStream = await navigator.mediaDevices.getUserMedia(params)

		this.audioInput = new AudioProcessor(this, {
			channelCount: 1,
			stream: this.micStream,
			volumeGate: {
				threshold: this.audioSettings.volumeGateThreshold,
				attack: 0.08,
				release: 0.04,
			},
			noiseSupression: this.audioSettings.noiseSuppression === "rnn",
		})

		if (this.audioOutput) {
			this.audioOutput.context.resume()
		}

		this.audioInput.mainNode.gain.value = parseFloat(
			this.audioSettings.inputGain,
		)

		await this.audioInput.initialize()
	}

	async destroyMicStream() {
		if (!this.micStream) {
			return false
		}

		this.micStream.getTracks().forEach((track) => track.stop())
		this.micStream = null

		this.audioInput.destroy()
		this.audioInput = null
	}

	async startMicProducer() {
		if (!this.micStream) {
			throw new Error("No local microphone stream available")
		}

		if (!this.audioInput || !this.audioInput.destinationNode) {
			throw new Error("No audio input available")
		}

		if (this.micProducer) {
			throw new Error("Microphone producer already started")
		}

		const audioTrack =
			this.audioInput.destinationNode.stream.getAudioTracks()[0]

		if (!audioTrack) {
			throw new Error("No audio track found")
		}

		this.micProducer = await this.core.producers.produce({
			track: audioTrack,
			codecs: [
				{
					kind: "audio",
					mimeType: "audio/opus",
					clockRate: 41000,
					channels: 1,
					dtx: true,
					opusDtx: true,
				},
			],
			codecOptions: {
				opusStereo: false,
				opusDtx: true,
			},
			encodings: [
				{
					...defaults.audioEncodingParams,
					...this.core.state.channel.encoding_params,
				},
			],
			appData: { mediaTag: "user-mic" },
		})

		// if the producer closes, set the mic producer to null
		this.micProducer.observer.on("close", () => {
			this.micProducer = null
			this.core.state.isProducingAudio = false

			this.core.console.log("mic production stopped")
		})

		this.core.state.isProducingAudio = true

		this.core.console.log("mic production started")
	}

	async stopMicProducer() {
		if (this.micProducer && !this.micProducer.closed) {
			this.micProducer.close()
		}
	}

	async createScreenStream(options: CreateScreenStreamOptions = {}) {
		if (this.screenStream) {
			this.screenStream.getTracks().forEach((track) => track.stop())
		}

		this.core.console.debug("createScreenStream options:", options)

		this.screenStream = await navigator.mediaDevices.getDisplayMedia({
			video: {
				width: { max: options.resolution?.width ?? 1920 },
				height: { max: options.resolution?.height ?? 1080 },
				frameRate: { max: options.framerate ?? 30 },
			},
			//@ts-ignore
			systemAudio: "include",
		})

		if (options.systemAudio && this.sysAudio) {
			try {
				const sysAudioTrack = await this.sysAudio.startCapture()

				this.screenStream.addTrack(sysAudioTrack)
			} catch (err) {
				console.error("Failed to start system audio capture", err)
			}
		}

		this.core.console.log("screen stream:", {
			screenStream: this.screenStream,
			screenStreamTracks: this.screenStream.getTracks(),
		})
	}

	async startScreenProducer() {
		if (!this.screenStream) {
			throw new Error("No local screen stream available")
		}

		const screenVideoTrack = this.screenStream.getVideoTracks()[0]
		const screenAudioTrack = this.screenStream.getAudioTracks()[0]

		if (!screenVideoTrack) {
			throw new Error("No screen track found")
		}

		// if scree audio is available, start producing
		if (screenAudioTrack) {
			this.screenAudioProducer = await this.core.producers.produce({
				track: screenAudioTrack,
				codecOptions: {
					opusStereo: true,
					opusFec: true,
				},
				encodings: [
					{
						...defaults.screenAudioEncodingParams,
					},
				],
				appData: {
					mediaTag: "screen-audio",
				},
			})

			// if the producer closes, set the screen audio producer to null
			this.screenAudioProducer.observer.on("close", () => {
				this.screenAudioProducer = null
				this.core.console.log("screen audio production stopped")
			})
		}

		const screenShareProducerData = {
			mediaTag: "screen-video",
			childrens: [],
		}

		if (this.screenAudioProducer) {
			screenShareProducerData.childrens.push(this.screenAudioProducer.id)
		}

		// produce
		this.screenProducer = await this.core.producers.produce({
			track: screenVideoTrack,
			encodings: [
				{
					...defaults.videoEncodingParams,
				},
			],
			appData: screenShareProducerData,
		})

		// if the producer closes, set the screen producer to null
		this.screenProducer.observer.on("close", () => {
			this.screenProducer = null
			this.core.state.isProducingScreen = false

			this.core.console.log("screen production stopped")
		})

		this.core.state.isProducingScreen = true
		this.core.console.log("screen production started")
	}

	async stopScreenProducer() {
		if (this.screenProducer && !this.screenProducer.closed) {
			await this.screenProducer.close()
		}

		if (this.screenAudioProducer && !this.screenAudioProducer.closed) {
			await this.screenAudioProducer.close()
		}
	}

	async destroyScreenStream() {
		if (!this.screenStream) {
			return false
		}

		this.screenStream.getTracks().forEach((track) => track.stop())
		this.screenStream = null

		if (this.sysAudio) {
			try {
				this.sysAudio.stopCapture()
			} catch (error) {
				console.error(`Failed to stop system audio capture:`, error)
			}
		}

		this.core.console.log("screen stream destroyed")
	}

	async createCameraStream(options = {}) {
		return null
		if (this.camStream) {
			this.camStream.getTracks().forEach((track) => track.stop())
		}

		this.core.console.debug("createCameraStream options:", options)

		const params = {
			video: {},
		}

		//@ts-ignore
		if (options.deviceId) {
			//@ts-ignore
			params.video.deviceId = {
				//@ts-ignore
				exact: options.deviceId,
			}
		}

		this.camStream = await navigator.mediaDevices.getUserMedia(params)

		return this.camStream
	}

	async destroyCameraStream() {
		if (this.camStream) {
			this.camStream.getTracks().forEach((track) => track.stop())
			this.camStream = null
		}
	}

	async startCameraProducer() {
		if (!this.camStream) {
			throw new Error("No local camera stream available")
		}

		const camVideoTrack = this.camStream.getVideoTracks()[0]

		if (!camVideoTrack) {
			throw new Error("No camera track found")
		}

		this.camProducer = await this.core.producers.produce({
			track: camVideoTrack,
			appData: {
				mediaTag: "user-cam",
			},
		})

		// if the producer closes, set the cam producer to null
		this.camProducer.observer.on("close", () => {
			this.camProducer = null
			this.core.state.isProducingCamera = false

			this.core.console.log("camera production stopped")
		})

		this.core.state.isProducingCamera = true

		this.core.console.log("camera production started")
	}

	async stopCameraProducer() {
		if (this.camProducer && !this.camProducer.closed) {
			this.camProducer.close()
		}
	}

	async stopAll() {
		if (this.micProducer && !this.micProducer.closed) {
			this.micProducer.close()
		}

		if (this.screenProducer && !this.screenProducer.closed) {
			this.screenProducer.close()
		}

		if (this.screenAudioProducer && !this.screenAudioProducer.closed) {
			this.screenAudioProducer.close()
		}

		if (this.micStream) {
			this.destroyMicStream()
		}

		if (this.camStream) {
			this.destroyCameraStream()
		}

		if (this.screenStream) {
			this.destroyScreenStream()
		}
	}
}
