export default async function () {
	if (this.audioProducer && this.audioProducer.paused) {
		app.cores.sfx.play("unmute")

		this.audioProducer.resume()

		this.state.isDeafened = this.isDeafened
		this.state.isMuted = this.isMuted

		await this.sendVoiceStateUpdate()
	}
}
