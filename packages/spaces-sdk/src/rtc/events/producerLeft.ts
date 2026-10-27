import type { RTC } from "@/rtc"

import adapter from "@/adapter"

export default async function (this: RTC, data: any) {
	if (!adapter.sessionGetter) return null

	const session = await adapter.sessionGetter()

	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === session.user_id) {
			return null
		}

		this.logger.log("Remote producer left", data)

		// delete from producers
		this.producers.delRemote(data)

		// stop all consumers
		await this.consumers.stopByProducerId(data.producerId)

		if (data.appData) {
			const client = this.clients.get(data.userId)

			if (data.appData.mediaTag === "user-mic" && client) {
				// only detach if the consumer still points to this producer
				await client.dettachMic(data.producerId)
			}

			// if a camera stops, drop it
			if (data.appData.mediaTag === "user-cam") {
				await this.cameras.removeProducer(
					data.userId,
					"video",
					data.producerId,
				)
			}

			// if a screen share ends, stop consuming its tracks
			if (data.appData.mediaTag === "screen-video") {
				//app.cores.sfx.play("media_video_leave")
				await this.screens.removeProducer(
					data.userId,
					"video",
					data.producerId,
				)
			}

			if (data.appData.mediaTag === "screen-audio") {
				await this.screens.removeProducer(
					data.userId,
					"audio",
					data.producerId,
				)
			}
		}

		this.eventBus.emit("rtc:producer:left", data)
	} catch (error) {
		this.logger.error("Error handling producer left:", error)

		this.eventBus.emit("rtc:producer:error", { error })
	}
}
