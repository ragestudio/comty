export default async function () {
	if (!this.screenStream) {
		throw new Error("No local screen stream available")
	}

	const screenVideoTrack = this.screenStream.getVideoTracks()[0]
	const screenAudioTrack = this.screenStream.getAudioTracks()[0]

	if (!screenVideoTrack) {
		throw new Error("No screen track found")
	}

	// if scree audio is available, start producing
	if (screenAudioTrack) {
		this.screenShareAudioProducer = await this.handlers.createProducer({
			track: screenAudioTrack,
			codecOptions: {
				opusStereo: true,
			},
			encodings: [
				{
					...this.constructor.defaultScreenAudioEncodingParams,
				},
			],
			appData: {
				mediaTag: "screen-audio",
			},
		})

		this.state.isProducingScreenAudio = true
	}

	const screenShareProducerData = {
		mediaTag: "screen-video",
		childrens: [],
	}

	if (this.screenShareAudioProducer) {
		screenShareProducerData.childrens.push(this.screenShareAudioProducer.id)
	}

	// produce
	this.screenShareProducer = await this.handlers.createProducer({
		track: screenVideoTrack,
		encodings: [
			{
				...this.constructor.defaultVideoEncodingParams,
			},
		],
		appData: screenShareProducerData,
	})

	this.state.isProducingScreen = true

	this.console.log("screen production started")
}
