import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	console.debug("disconnected from channel:", data)
}
