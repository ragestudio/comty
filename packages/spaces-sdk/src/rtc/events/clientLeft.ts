import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	try {
		await this.clients.leave(data.userId)
	} catch (error) {
		console.error("Error handling client left:", error)
	}
}
