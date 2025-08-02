export default async function () {
	// Check if system audio capture is currently active
	if (!this.systemAudioCaptureActive) {
		this.console.log("system audio capture is not active")
		return {
			success: true,
			message: "System audio capture was not active",
		}
	}

	// Stop system audio capture if ipcRenderer is available
	if (window.ipcRenderer) {
		try {
			await window.ipcRenderer.invoke(
				"desktopcapturer:stopSystemAudioCapture",
			)

			this.systemAudioCaptureActive = false

			this.console.log("system audio capture stopped manually")

			return {
				success: true,
				message: "System audio capture stopped successfully",
			}
		} catch (error) {
			console.error("Failed to stop system audio capture:", error)

			return {
				success: false,
				error: error.message,
				message: "Failed to stop system audio capture",
			}
		}
	}

	// If no IPC available, just update local flag
	this.systemAudioCaptureActive = false

	return {
		success: true,
		message: "System audio capture flag cleared (no IPC available)",
	}
}
