export default async function (options = {}) {
	if (this.screenStream) {
		this.screenStream.getTracks().forEach((track) => track.stop())
	}

	console.log(options)

	this.screenStream = await navigator.mediaDevices.getDisplayMedia({
		video: {
			width: { max: options.resolution?.width ?? 1920 },
			height: { max: options.resolution?.height ?? 1080 },
			frameRate: { max: options.framerate ?? 60 },
		},
	})

	// if ipcRenderer is available, start system audio capture and
	// append it to the screen stream
	if (window.ipcRenderer) {
		// Start system audio capture (routes all system audio except our app)
		const captureInfo = await window.ipcRenderer.invoke(
			"desktopcapturer:getAudioLoopbackRemapDeviceId",
		)

		const devices = await navigator.mediaDevices.enumerateDevices()

		const loopbackDevice = devices.find(
			(device) => device.label === captureInfo.name,
		)

		console.log({ devices, captureInfo, loopbackDevice })

		if (loopbackDevice) {
			console.log("Using audio loopback device", loopbackDevice)

			const audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: {
						exact: loopbackDevice.deviceId,
					},
					autoGainControl: false,
					echoCancellation: false,
					noiseSuppression: false,
					channelCount: {
						min: 2,
						ideal: 2,
						max: 2,
					},
					sampleRate: 44100,
					sampleSize: 16,
				},
			})

			this.screenStream.addTrack(audioStream.getAudioTracks()[0])
		}
	}

	console.log("screen stream:", {
		screenStream: this.screenStream,
		screenStreamTracks: this.screenStream.getTracks(),
	})

	this.state.screenStreamInitialized = true
}
