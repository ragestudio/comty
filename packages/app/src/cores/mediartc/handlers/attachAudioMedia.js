export default async function (consumer, producerId, userId) {
	try {
		if (consumer.track.kind !== "audio") {
			console.debug("Not playing audio for non-audio track")
			return null
		}

		const audioElement = new Audio()
		const mediaStream = new MediaStream([consumer.track])
		const source = this.audioOutput.context.createMediaStreamSource(mediaStream)

		audioElement.srcObject = mediaStream
		audioElement.muted = true

		source.connect(this.audioOutput.mainNode)

		this.audioElements.set(producerId, audioElement)

		audioElement.onerror = (error) => {
			this.console.error("Audio playback error:", error)
		}

		await audioElement.play()

		this.console.debug("attached consumer audio media")
	} catch (error) {
		this.console.error("Error setting up audio playback:", error)
	}
}
