export default async function () {
	await this.handlers.stopScreenProducer()

	if (this.screenStream) {
		this.screenStream.getTracks().forEach((track) => track.stop())
		this.screenStream = null
	}

	if (this.screenStreamAudio) {
		this.screenStreamAudio.getTracks().forEach((track) => track.stop())
		this.screenStreamAudio = null
	}

	// Stop system audio capture if it was active
	// if (this.systemAudioCaptureActive && window.ipcRenderer) {
	// 	try {
	// 		await window.ipcRenderer.invoke(
	// 			"desktopcapturer:stopSystemAudioCapture",
	// 		)
	// 		this.console.log("system audio capture stopped")
	// 	} catch (error) {
	// 		console.error("Failed to stop system audio capture:", error)
	// 	}
	// }

	this.state.screenStreamInitialized = false

	app.cores.sfx.play("media_video_leave")

	this.console.log("screen share stopped")
}
