export default async function () {
	if (this.audioProducer && !this.audioProducer.paused) {
		app.cores.sfx.play("mute")

		await this.audioProducer.pause()

		this.state.isDeafened = this.isDeafened
		this.state.isMuted = this.isMuted

		await this.sendVoiceStateUpdate()
	}
}
