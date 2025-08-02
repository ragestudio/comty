export default class VoiceDetector {
	constructor(options = {}) {
		this.options = {
			threshold: options.threshold || 0.01, // Volume threshold for voice detection
			minSpeakingTime: options.minSpeakingTime || 300, // Minimum time to consider speaking (ms)
			minSilenceTime: options.minSilenceTime || 500, // Minimum silence time to stop speaking (ms)
			smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
			fftSize: options.fftSize || 512,
			...options,
		}

		this.audioContext = null
		this.analyser = null
		this.microphone = null
		this.dataArray = null
		this.animationId = null

		this.isSpeaking = false
		this.lastVoiceTime = 0
		this.lastSilenceTime = 0
		this.volumeLevel = 0

		this.onSpeakingStart = null
		this.onSpeakingStop = null
		this.onVolumeChange = null
	}

	async initialize(stream) {
		try {
			// Create audio context
			this.audioContext = new (window.AudioContext ||
				window.webkitAudioContext)()

			// Create analyser node
			this.analyser = this.audioContext.createAnalyser()
			this.analyser.fftSize = this.options.fftSize
			this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant

			// Create microphone source
			this.microphone = this.audioContext.createMediaStreamSource(stream)

			// Connect microphone to analyser
			this.microphone.connect(this.analyser)

			// Create data array for frequency data
			this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

			// Start monitoring
			this.startMonitoring()

			return true
		} catch (error) {
			console.error("Error initializing voice detector:", error)
			throw error
		}
	}

	startMonitoring() {
		if (this.animationId) {
			return
		}

		const monitor = () => {
			if (!this.analyser || !this.dataArray) {
				return
			}

			// Get frequency data
			this.analyser.getByteFrequencyData(this.dataArray)

			// Calculate volume level
			this.volumeLevel = this.calculateVolumeLevel()

			// Detect voice activity
			this.detectVoiceActivity()

			// Emit volume change event
			if (this.onVolumeChange) {
				this.onVolumeChange(this.volumeLevel)
			}

			// Continue monitoring
			this.animationId = requestAnimationFrame(monitor)
		}

		monitor()
	}

	stopMonitoring() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId)
			this.animationId = null
		}
	}

	calculateVolumeLevel() {
		if (!this.dataArray) {
			return 0
		}

		// Calculate RMS (Root Mean Square) for more accurate volume detection
		let sum = 0

		for (let i = 0; i < this.dataArray.length; i++) {
			const amplitude = this.dataArray[i] / 255
			sum += amplitude * amplitude
		}

		const rms = Math.sqrt(sum / this.dataArray.length)

		return Math.min(rms, 1)
	}

	detectVoiceActivity() {
		const now = Date.now()
		const isAboveThreshold = this.volumeLevel > this.options.threshold

		if (isAboveThreshold) {
			this.lastVoiceTime = now

			// Start speaking if not already speaking and minimum time has passed
			if (
				!this.isSpeaking &&
				now - this.lastSilenceTime > this.options.minSilenceTime
			) {
				this.isSpeaking = true
				if (this.onSpeakingStart) {
					this.onSpeakingStart()
				}
			}
		} else {
			this.lastSilenceTime = now

			// Stop speaking if currently speaking and minimum silence time has passed
			if (
				this.isSpeaking &&
				now - this.lastVoiceTime > this.options.minSpeakingTime
			) {
				this.isSpeaking = false
				if (this.onSpeakingStop) {
					this.onSpeakingStop()
				}
			}
		}
	}

	// Set event handlers
	onSpeaking(startCallback, stopCallback) {
		this.onSpeakingStart = startCallback
		this.onSpeakingStop = stopCallback
	}

	onVolume(callback) {
		this.onVolumeChange = callback
	}

	// Getters
	get speaking() {
		return this.isSpeaking
	}

	get volume() {
		return this.volumeLevel
	}

	// Update threshold dynamically
	setThreshold(threshold) {
		this.options.threshold = Math.max(0, Math.min(1, threshold))
	}

	// Cleanup
	destroy() {
		this.stopMonitoring()

		if (this.microphone) {
			this.microphone.disconnect()
			this.microphone = null
		}

		if (this.analyser) {
			this.analyser.disconnect()
			this.analyser = null
		}

		if (this.audioContext && this.audioContext.state !== "closed") {
			this.audioContext.close()
			this.audioContext = null
		}

		this.dataArray = null
		this.onSpeakingStart = null
		this.onSpeakingStop = null
		this.onVolumeChange = null
	}
}
