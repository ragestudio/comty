export default async function () {
	if (!this.audioStream) {
		return false
	}

	await this.handlers.stopAudioProducer()
	await this.handlers.initializeUserAudio()
	await this.handlers.startAudioProducer()

	return true
}
