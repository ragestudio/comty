export default async function (data) {
	// stop voice detection
	await this.handlers.stopVoiceDetector(data.userId)

	// detach audio media
	await this.handlers.dettachAudioMedia(data.producerId)
}
