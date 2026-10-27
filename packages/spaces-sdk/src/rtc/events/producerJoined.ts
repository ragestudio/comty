import type { RTC } from "@/rtc"
import type { Producer } from "@/rtc/producers/producer"

import adapter from "@/adapter"

export default async function (this: RTC, data: Producer) {
	if (!adapter.sessionGetter) return null

	const session = await adapter.sessionGetter()

	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === session.user_id) {
			return null
		}

		this.logger.debug(`Remote producer joined:`, data)

		// add as remote producer
		this.producers.setRemote(data)

		if (data.appData) {
			// ghost clients may not be registered yet (missing join event or a
			// reconnection), so create them on demand instead of aborting
			const client =
				this.clients.get(data.userId) ??
				(await this.clients.join({ userId: data.userId }))

			if (client && data.appData.mediaTag === "user-mic") {
				// if is a user mic, start the consumer and attach mic
				await client.attachMic(data).catch((error) => {
					this.logger.error("Error attaching client mic:", error)
				})
			}

			// if user camera, register it as available
			if (data.appData.mediaTag === "user-cam") {
				this.cameras.add(data)
			}

			// if a screen share starts, register it as available
			if (data.appData.mediaTag === "screen-video") {
				this.screens.add(data)
			}

			if (data.appData.mediaTag === "screen-audio") {
				this.screens.add(data)
			}
		}

		this.eventBus.emit("rtc:producer:joined", data)
	} catch (error) {
		this.logger.error("Error handling producer joined:", error)

		this.eventBus.emit("rtc:producer:error", { error })
	}
}
