export default async function (payload) {
	if (!payload) {
		return false
	}

	if (typeof payload.deviceId === "string") {
		this.console.debug("updating input device")

		app.cores.settings.set("mediartc:input_device", payload.deviceId)

		if (this.self.micStream) {
			await this.self.destroyMicStream()
			await this.self.createMicStream()
		}

		if (this.self.micProducer) {
			await this.self.stopMicProducer()
			await this.self.startMicProducer()
		}

		return true
	}

	this.self.audioSettings = payload

	return true
}
