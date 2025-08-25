export default async (core, data) => {
	try {
		// if self producer, ignore
		// the server should not send this event for itself
		if (data.userId === app.userData._id) {
			return null
		}

		core.console.debug(`Remote producer joined:`, data)

		// add to producers
		core.producers.set(data.producerId, {
			remote: true,
			...data,
		})

		if (data.appData) {
			const client = core.clients.get(data.userId)

			if (!client) {
				throw new Error("Client not found/available")
			}

			// if is a user mic, start the consumer and attach mic
			if (data.appData.mediaTag === "user-mic") {
				client.attachMic(data)
			}

			// if user screen, just play sfx
			if (data.appData.mediaTag === "screen-video") {
				app.cores.sfx.play("media_video_join")
			}
		}
	} catch (error) {
		core.console.error("Error handling producer joined:", error)
	}
}
