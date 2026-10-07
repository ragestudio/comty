import adapter from "@/adapter"
import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	if (!adapter.sessionGetter) return null

	const session = await adapter.sessionGetter()

	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === session.user_id) {
			return null
		}

		console.log("Remote producer left", data)

		// delete from producers
		this.producers.delRemote(data)

		// stop all consumers
		await this.consumers.stopByProducerId(data.producerId)

		if (data.appData) {
			const client = this.clients.get(data.userId)

			if (!client) return

			if (data.appData.mediaTag === "user-mic") {
				client.dettachMic()
			}

			if (data.appData.mediaTag === "screen-video") {
				//app.cores.sfx.play("media_video_leave")
			}
		}
	} catch (error) {
		console.error("Error handling producer left:", error)
	}
}
