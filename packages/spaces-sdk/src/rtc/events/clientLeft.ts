import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
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
