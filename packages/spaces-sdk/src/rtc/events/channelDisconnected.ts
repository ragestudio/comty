import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	this.logger.debug("disconnected from channel:", data)

	this.eventBus.emit("rtc:channel:disconnected", data)
}
