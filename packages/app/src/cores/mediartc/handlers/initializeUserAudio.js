export default async function (params = {}) {
	try {
		if (this.audioStream) {
			this.audioStream.getTracks().forEach((track) => track.stop())
		}

		this.audioStream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: params.deviceId ?? this.constructor.inputDeviceId,
				echoCancellation:
					params.echoCancellation ?? this.audioParams.echoCancellation,
				noiseSuppression:
					params.noiseSuppression ?? this.audioParams.noiseSuppression,
				autoGainControl:
					params.autoGainControl ?? this.audioParams.autoGainControl,
				sampleRate: params.sampleRate ?? this.audioParams.sampleRate,
				channelCount: params.channelCount ?? this.audioParams.channelCount,
			},
		})
	} catch (error) {
		this.console.error("Error getting user media:", error)
		throw new Error("Failed to get microphone access: " + error.message)
	}
}
