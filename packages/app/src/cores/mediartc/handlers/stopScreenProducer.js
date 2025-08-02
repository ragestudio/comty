export default async function () {
	if (!this.screenShareProducer) {
		this.console.warn("No screen share producer found")
		return false
	}

	if (this.screenShareProducer && !this.screenShareProducer.closed) {
		await this.screenShareProducer.close()

		this.screenShareProducer = null
		this.state.isProducingScreen = false
	}

	if (this.screenShareAudioProducer) {
		if (
			this.screenShareAudioProducer &&
			!this.screenShareAudioProducer.closed
		) {
			await this.screenShareAudioProducer.close()

			this.screenShareAudioProducer = null
			this.state.isProducingScreenAudio = false
		}
	}

	this.console.log("screen production stopped")
}
