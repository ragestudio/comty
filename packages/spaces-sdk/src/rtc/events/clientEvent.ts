import type { RTC } from "@/rtc"
import type { RTC_ClientEvent } from "@comty/shared/types/rtc/events/inbound"

export default async function (this: RTC, data: RTC_ClientEvent) {
	this.logger.debug("received client event:", data)

	const client =
		this.clients.get(data.userId) ??
		(await this.clients.join({ userId: data.userId }))

	if (!client) {
		throw new Error("Client not found")
	}

	switch (data.event) {
		case "updateVoiceState": {
			client.updateVoiceState(data.data)
			break
		}
		case "soundpad": {
			client.dispatchSoundpad(data)
			break
		}

		default: {
			throw new Error("Invalid event")
		}
	}
}
