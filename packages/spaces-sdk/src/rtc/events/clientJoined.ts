import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	try {
		await this.clients.join(data)
	} catch (error) {
		console.error("Error handling client joined:", error)
	}
}
