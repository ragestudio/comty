import type { RTC } from "@/rtc"
import type { RTC_ClientEvent } from "@comty/shared/types/rtc/events/inbound"

export default async function (this: RTC, data: RTC_ClientEvent) {
	console.debug("received client event:", data)

	const client = this.clients.get(data.userId)

	if (!client) {
		throw new Error("Client not found")
	}

	switch (data.event) {
		case "updateVoiceState": {
			client.updateVoiceState(data.data)
			break
		}

		default: {
			throw new Error("Invalid event")
		}
	}
}
