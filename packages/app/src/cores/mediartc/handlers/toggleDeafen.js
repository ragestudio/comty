export default async function (to) {
	if (!this.self.audioOutput) {
		return false
	}

	if (typeof to !== "boolean") {
		to = !this.self.isDeafened
	}

	if (to) {
		app.cores.sfx.play("deafen")

		if (this.self.sysAudio && this.self.sysAudio?.outputBus) {
			this.self.sysAudio.outputBus.gain.value = 0
		} else {
			await this.self.audioOutput.context.suspend()
		}
	} else {
		app.cores.sfx.play("undeafen")

		if (this.self.sysAudio && this.self.sysAudio?.outputBus) {
			this.self.sysAudio.outputBus.gain.value = 1
		} else {
			await this.self.audioOutput.context.resume()
		}
	}

	await this.handlers.toggleMute(to)

	this.state.isDeafened = this.self.isDeafened
	this.state.isMuted = this.self.isMuted

	await this.sendVoiceStateUpdate()
}
