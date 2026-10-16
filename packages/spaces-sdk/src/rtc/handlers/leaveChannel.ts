import type { RTC } from ".."

export async function leaveChannel(this: RTC) {
	if (!this.socket) {
		throw new Error("Cannot leave channel without socket or userId")
	}

	try {
		await this.handlers.reset()
		await this.socket.call("channel:leave")

		this.eventBus.emit("rtc:channel:left")
	} catch (error) {
		this.eventBus.emit("rtc:channel:leave_failed", { error })

		throw error
	}
}

export default leaveChannel
