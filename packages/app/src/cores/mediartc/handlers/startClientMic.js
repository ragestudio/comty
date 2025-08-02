export default async function (data) {
	const consumer = await this.handlers.startConsumer({
		producerId: data.producerId,
		userId: data.userId,
		kind: data.kind,
		appData: data.appData,
	})

	await this.handlers.attachAudioMedia(consumer, data.producerId, data.userId)

	// Initialize voice detection for remote audio
	await this.handlers.startVoiceDetector(
		new MediaStream([consumer.track]),
		data.userId,
	)
}
