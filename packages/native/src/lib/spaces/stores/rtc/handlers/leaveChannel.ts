import type { RTC } from ".."

export async function leaveChannel(this: RTC) {
	if (!this.socket) {
		throw new Error("Cannot leave channel without socket or userId")
	}

	await this.handlers.reset()
	await this.socket.call("channel:leave")
}

export default leaveChannel
