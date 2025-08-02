export default async (core, data) => {
	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === app.userData._id) {
			return null
		}

		core.console.debug(`Producer joined:`, data)

		// add to producers
		core.producers.set(data.producerId, data)

		if (data.appData) {
			// if is a user mic, start the consumer and attach media & voice detector
			if (data.appData.mediaTag === "user-mic") {
				core.handlers.startClientMic(data)
			}

			// if user screen, play sfx
			if (data.appData.mediaTag === "screen-video") {
				app.cores.sfx.play("media_video_join")
			}
		}
	} catch (error) {
		core.console.error("Error handling producer joined:", error)
	}
}
