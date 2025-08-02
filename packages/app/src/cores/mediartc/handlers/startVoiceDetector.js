import VoiceDetector from "../classes/VoiceDetector"

export default async function (stream, userId) {
	try {
		if (!(stream instanceof MediaStream)) {
			throw new Error("Missing media stream")
		}

		if (typeof userId !== "string") {
			throw new Error("Invalid userId")
		}

		const voiceDetector = new VoiceDetector({
			threshold: 0.1,
			minSpeakingTime: 50,
			minSilenceTime: 500,
		})

		await voiceDetector.initialize(stream)

		voiceDetector.onSpeaking(
			() => {
				this.state.speakingClients[userId] = {
					speaking: true,
				}
			},
			() => {
				delete this.state.speakingClients[userId]
			},
		)

		this.voiceDetectors.add({
			userId: userId,
			streamId: stream.id,
			detector: voiceDetector,
		})
	} catch (error) {
		this.console.error("Error initializing voice detection:", error)
	}
}
