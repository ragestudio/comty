import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	// ignore events for a channel we are not in (stale events after leaving)
	if (!this.channel) return

	try {
		const client = this.clients.get(data.userId)

		await this.clients.leave(data.userId)

		if (client) {
			this.eventBus.emit("rtc:client:left", client)
		}
	} catch (error) {
		this.logger.error("Error handling client left:", error)
	}
}
