export default async function (payload) {
	if (!payload) {
		return false
	}

	if (typeof payload.deviceId === "string") {
		this.console.debug("updating input device")

		app.cores.settings.set("mediartc:input_device", payload.deviceId)
		await this.self.restartMic()

		return true
	}

	this.self.audioSettings = payload

	return true
}
