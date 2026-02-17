export default async function (to) {
	if (!this.self.micStream) {
		return false
	}

	if (typeof to !== "boolean") {
		to = !this.self.isMuted
	}

	const audioTracks = this.self.micStream.getAudioTracks()

	if (to) {
		app.cores.sfx.play("mute")
		for (const track of audioTracks) {
			track.enabled = false
		}
	} else {
		app.cores.sfx.play("unmute")
		for (const track of audioTracks) {
			track.enabled = true
		}
	}

	this.state.isDeafened = this.self.isDeafened
	this.state.isMuted = this.self.isMuted

	await this.sendVoiceStateUpdate()
}
