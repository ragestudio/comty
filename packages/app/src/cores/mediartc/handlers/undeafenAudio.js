export default async function () {
	app.cores.sfx.play("undeafen")

	await this.audioOutput.context.resume()

	if (this.audioProducer.paused) {
		this.audioProducer.resume()
	}

	this.state.isDeafened = this.isDeafened
	this.state.isMuted = this.isMuted

	await this.sendVoiceStateUpdate()
}
