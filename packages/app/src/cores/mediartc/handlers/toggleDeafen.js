export default async function (to) {
	if (!this.self.audioOutput) {
		return false
	}

	if (typeof to !== "boolean") {
		to = !this.self.isDeafened
	}

	if (to) {
		app.cores.sfx.play("deafen")
		await this.self.audioOutput.context.suspend()
	} else {
		app.cores.sfx.play("undeafen")
		await this.self.audioOutput.context.resume()
	}

	await this.handlers.toggleMute(to)

	this.state.isDeafened = this.self.isDeafened
	this.state.isMuted = this.self.isMuted

	await this.sendVoiceStateUpdate()
}
