export default async function () {
	app.cores.sfx.play("deafen")

	await this.audioOutput.context.suspend()

	if (!this.audioProducer.paused) {
		this.audioProducer.pause()
	}

	this.state.isDeafened = this.isDeafened
	this.state.isMuted = this.isMuted

	await this.sendVoiceStateUpdate()
}
