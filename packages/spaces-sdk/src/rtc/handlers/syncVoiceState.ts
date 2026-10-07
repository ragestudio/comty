import type { RTC } from ".."

export function syncVoiceState(this: RTC) {
	const isMuted = this.self.isMuted
	const isDeafened = this.self.isDeafened

	// Update local voice state
	this.setState({
		voiceState: {
			muted: isMuted,
			deafened: isDeafened,
		},
	})

	// if socket is connected, emit voice state update
	if (this.socket) {
		try {
			this.socket.emit("channel:client_event", {
				event: "updateVoiceState",
				data: {
					muted: isMuted,
					deafen: isDeafened,
				},
			})
		} catch (e) {
			console.error(e)
		}
	}
}

export default syncVoiceState
