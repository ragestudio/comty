export default async function () {
	try {
		if (!this.audioProducer || this.audioProducer.closed) {
			return
		}

		// Close producer
		this.audioProducer.close()

		this.audioProducer = null
		this.state.isProducingAudio = false

		this.console.log("audio production stopped")
	} catch (error) {
		this.console.error("Error stopping audio production:", error)
		throw error
	}
}
