import type MediaRTC from "../mediartc.core"

export default async (core: MediaRTC, data: any) => {
	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === app.userData._id) {
			return null
		}

		core.console.log("Remote producer left", data)

		// delete from producers
		core.producers.delRemote(data)

		// stop all consumers
		await core.consumers.stopByProducerId(data.producerId)

		if (data.appData) {
			const client = core.clients.get(data.userId)

			if (data.appData.mediaTag === "user-mic") {
				client.dettachMic()
			}

			if (data.appData.mediaTag === "screen-video") {
				app.cores.sfx.play("media_video_leave")
			}
		}
	} catch (error) {
		core.console.error("Error handling producer left:", error)
	}
}
