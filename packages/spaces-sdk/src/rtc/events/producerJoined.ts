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

		console.debug(`Remote producer joined:`, data)

		// add as remote producer
		this.producers.setRemote(data)

		if (data.appData) {
			const client = this.clients.get(data.userId)

			if (!client) {
				throw new Error("Client not found/available")
			}

			// if is a user mic, start the consumer and attach mic
			if (data.appData.mediaTag === "user-mic") {
				client.attachMic(data)
			}

			// if user camera, just play sfx
			if (data.appData.mediaTag === "user-cam") {
				//app.cores.sfx.play("media_video_join")
			}

			// if user screen, just play sfx
			if (data.appData.mediaTag === "screen-video") {
				//app.cores.sfx.play("media_video_join")
			}
		}
	} catch (error) {
		console.error("Error handling producer joined:", error)
	}
}
