import AudioProcessor from "./AudioProcessor"

export default class Self {
	constructor(core) {
		this.core = core

		if (!core) {
			new Error("Core not provided")
		}
	}

	micStream = null
	micProducer = null

	screenStream = null
	screenProducer = null
	screenAudioProducer = null

	audioInput = null
	audioOutput = new AudioProcessor(this, {
		sinkId: Self.outputDeviceId,
	})

	get isMuted() {
		return this.micStream ? !this.micStream.getTracks()[0].enabled : false
	}

	get isDeafened() {
		return this.audioOutput.context.state === "suspended"
	}

	get audioSettings() {
		return {
			echoCancellation:
				app.cores.settings.get("mediartc:echoCancellation") ?? true,
			noiseSuppression:
				app.cores.settings.get("mediartc:noiseSuppression") ?? true,
			autoGainControl:
				app.cores.settings.get("mediartc:audioGainControl") ?? true,
			volume: app.cores.settings.get("mediartc:audioVolume") ?? 1.0,
			noiseGateThreshold:
				app.cores.settings.get("mediartc:noiseGateThreshold") ?? "-40",
			inputGain: app.cores.settings.get("mediartc:inputGain") ?? "1.0",
			outputGain: app.cores.settings.get("mediartc:outputGain") ?? "1.0",
		}
	}

	set audioSettings(update = {}) {
		for (const [key, value] of Object.entries(update)) {
			this.core.console.log("setting audio setting", key, value)

			if (key === "noiseGateThreshold") {
				const thresholdParameter = app.cores.mediartc
					.instance()
					.self.audioInput.noiseGateProccesor.parameters.get(
						"threshold",
					)
				thresholdParameter.value = value
			}

			if (key === "inputGain") {
				const inputGainParameter =
					app.cores.mediartc.instance().self.audioInput.mainNode.gain

				inputGainParameter.value = value
			}

			if (key === "outputGain") {
				const outputGainParameter =
					app.cores.mediartc.instance().self.audioOutput.mainNode.gain

				outputGainParameter.value = value
			}

			if (key === "echoCancellation") {
				this.updateMicStreamConstraints({
					echoCancellation: value,
				})
			}

			if (key === "noiseSuppression") {
				this.updateMicStreamConstraints({
					noiseSuppression: value,
				})
			}

			if (key === "autoGainControl") {
				this.updateMicStreamConstraints({
					autoGainControl: value,
				})
			}
		}
	}

	static get inputDeviceId() {
		return app.cores.settings.get("mediartc:input_device")
	}

	static get outputDeviceId() {
		return app.cores.settings.get("mediartc:output_device")
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

		this.micStream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: Self.inputDeviceId,
				echoCancellation: this.audioSettings.echoCancellation,
				noiseSuppression: this.audioSettings.noiseSuppression,
				autoGainControl: this.audioSettings.autoGainControl,
				voiceIsolation: true,
				sampleRate: 44100,
				channelCount: 1,
			},
		})

		this.audioInput = new AudioProcessor(this, {
			stream: this.micStream,
			noiseGate: {
				threshold: this.audioSettings.noiseGateThreshold,
				attack: 0.08,
				release: 0.04,
			},
		})

		this.audioInput.mainNode.gain.value = parseFloat(
			this.audioSettings.inputGain,
		)

		this.core.state.micStreamAvailable = true

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

		this.core.state.micStreamAvailable = false
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
					...this.core.constructor.defaultAudioEncodingParams,
					...this.core.state.channel.encoding_params,
				},
			],
			appData: { mediaTag: "user-mic" },
		})

		this.core.state.isProducingAudio = true

		this.core.console.log("audio production started")
	}

	async stopMicProducer() {
		if (!this.micProducer) {
			return false
		}

		this.micProducer.close()
		this.micProducer = null

		this.core.state.isProducingAudio = false

		this.core.console.log("audio production stopped")
	}

	async createScreenStream(options = {}) {
		if (this.screenStream) {
			this.screenStream.getTracks().forEach((track) => track.stop())
		}

		console.log(options)

		this.screenStream = await navigator.mediaDevices.getDisplayMedia({
			video: {
				width: { max: options.resolution?.width ?? 1920 },
				height: { max: options.resolution?.height ?? 1080 },
				frameRate: { max: options.framerate ?? 60 },
			},
		})

		// if ipcRenderer is available, start system audio capture and
		// append it to the screen stream
		if (window.ipcRenderer) {
			// Start system audio capture (routes all system audio except our app)
			const captureInfo = await window.ipcRenderer.invoke(
				"desktopcapturer:getAudioLoopbackRemapDeviceId",
			)

			const devices = await navigator.mediaDevices.enumerateDevices()

			const loopbackDevice = devices.find(
				(device) => device.label === captureInfo.name,
			)

			console.log({ devices, captureInfo, loopbackDevice })

			if (loopbackDevice) {
				console.log("Using audio loopback device", loopbackDevice)

				const audioStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: {
							exact: loopbackDevice.deviceId,
						},
						autoGainControl: false,
						echoCancellation: false,
						noiseSuppression: false,
						channelCount: {
							min: 2,
							ideal: 2,
							max: 2,
						},
						sampleRate: 44100,
						sampleSize: 16,
					},
				})

				this.screenStream.addTrack(audioStream.getAudioTracks()[0])
			}
		}

		this.core.console.log("screen stream:", {
			screenStream: this.screenStream,
			screenStreamTracks: this.screenStream.getTracks(),
		})

		this.core.state.screenStreamInitialized = true
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
				},
				encodings: [
					{
						...this.core.constructor
							.defaultScreenAudioEncodingParams,
					},
				],
				appData: {
					mediaTag: "screen-audio",
				},
			})

			this.core.state.isProducingScreenAudio = true
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
					...this.core.constructor.defaultVideoEncodingParams,
				},
			],
			appData: screenShareProducerData,
		})

		this.core.state.isProducingScreen = true

		this.core.console.log("screen production started")
	}

	async stopScreenProducer() {
		if (!this.screenProducer) {
			return false
		}

		if (this.screenProducer && !this.screenProducer.closed) {
			await this.screenProducer.close()

			this.screenProducer = null
			this.core.state.isProducingScreen = false
		}

		if (this.screenAudioProducer) {
			if (this.screenAudioProducer && !this.screenAudioProducer.closed) {
				await this.screenAudioProducer.close()

				this.screenAudioProducer = null
				this.core.state.isProducingScreenAudio = false
			}
		}

		this.core.console.log("screen production stopped")
	}

	async destroyScreenStream() {
		if (!this.screenStream) {
			return false
		}

		this.screenStream.getTracks().forEach((track) => track.stop())
		this.screenStream = null

		this.core.state.isProducingScreen = false

		this.core.console.log("screen stream destroyed")
	}
}
