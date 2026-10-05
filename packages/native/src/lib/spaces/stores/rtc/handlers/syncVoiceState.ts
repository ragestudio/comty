import type { RTC } from ".."

export function syncVoiceState(this: RTC) {
	const isMuted = this.self.isMuted
	const isDeafened = this.self.isDeafened

	this.setState({ isMuted, isDeafened })

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
