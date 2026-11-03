import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	// ignore events for a channel we are not in (stale events after leaving)
	if (!this.channel) return

	try {
		const client = await this.clients.join(data)

		if (client) {
			this.eventBus.emit("rtc:client:joined", client)
		}
	} catch (error) {
		this.logger.error("Error handling client joined:", error)
	}
}
