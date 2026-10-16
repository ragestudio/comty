import type { RTC } from "@/rtc"
import type { RTC_ClientEvents } from "@comty/shared/types/rtc/events/inbound"

export default async function (
	this: RTC,
	event: RTC_ClientEvents,
	payload: any,
) {
	if (!this.socket) {
		this.logger.error("Cannot emit a client event without a socket")
		return
	}

	this.socket.emit("channel:client_event", {
		event: event,
		data: payload,
	})
}
