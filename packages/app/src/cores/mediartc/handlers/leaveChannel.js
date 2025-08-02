export default async function () {
	try {
		if (!this.state.isJoined) {
			this.console.warn("No channel to leave")
			return null
		}

		this.console.log("Leaving channel:", {
			channelId: this.state.channelId,
		})

		app.cores.sfx.play("media_channel_leave")

		if (this.ui) {
			this.ui.detach()
		}

		// stop producers
		await this.handlers.stopAudioProducer()
		await this.handlers.stopScreenProducer()

		// destroy all consumers
		for (const [producerId, consumer] of this.consumers) {
			if (!consumer.closed) {
				consumer.close()
			}
		}

		// clear consumers map
		this.consumers.clear()

		// clear producers map
		this.producers.clear()

		// destroy all remaining voice detectors
		for await (const voiceDetector of this.voiceDetectors.values()) {
			await voiceDetector.detector.destroy()
		}

		this.voiceDetectors.clear()

		// destroy all remaining attached media
		for (const [producerId, audioElement] of this.audioElements) {
			audioElement.pause()
			audioElement.srcObject = null
		}

		this.audioElements.clear()

		// close transports
		if (this.sendTransport && !this.sendTransport.closed) {
			this.sendTransport.close()
		}
		if (this.recvTransport && !this.recvTransport.closed) {
			this.recvTransport.close()
		}

		// stop local streams
		if (this.audioStream) {
			this.audioStream.getTracks().forEach((track) => track.stop())
		}
		if (this.screenStream) {
			this.screenStream.getTracks().forEach((track) => track.stop())
		}

		// stop system audio capture if active
		if (this.systemAudioCaptureActive && window.ipcRenderer) {
			try {
				await window.ipcRenderer.invoke(
					"desktopcapturer:stopSystemAudioCapture",
				)
				this.systemAudioCaptureActive = false
				this.console.log(
					"system audio capture stopped on channel leave",
				)
			} catch (error) {
				console.error(
					"Failed to stop system audio capture on channel leave:",
					error,
				)
			}
		}

		// call socket to leave
		await this.socket.call("channel:leave")

		// clear device
		this.device = null
		this.state.isJoined = false
		this.state.isLoading = false
		this.state.channelId = null
		this.state.channel = null

		this.console.log("Left channel", {
			channelId: this.state.channelId,
		})
	} catch (error) {
		this.console.error("Error leaving channel:", error)

		app.cores.notifications.new({
			title: "Failed to leave channel",
			message: error.message,
			type: "error",
		})
	}
}
