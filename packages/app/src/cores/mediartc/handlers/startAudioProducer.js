export default async function () {
	try {
		if (!this.audioStream) {
			throw new Error("No local audio stream available")
		}

		if (this.audioProducer) {
			throw new Error("Audio producer already started")
		}

		const audioTrack = this.audioStream.getAudioTracks()[0]

		if (!audioTrack) {
			throw new Error("No audio track found")
		}

		this.audioProducer = await this.handlers.createProducer({
			track: audioTrack,
			encodings: [
				{
					...this.constructor.defaultAudioEncodingParams,
					...this.state.channel.encoding_params,
				},
			],
			appData: { mediaTag: "user-mic" },
		})

		this.state.isProducingAudio = true

		this.console.log("audio production started")
	} catch (error) {
		this.console.error("Error starting production:", error)
		throw error
	}
}
