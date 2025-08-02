export default async (core, data) => {
	try {
		core.console.log("Producer left", data)

		// delete from producers
		core.producers.delete(data.producerId)

		// try to stop the consumer
		core.handlers.stopConsumer({
			producerId: data.producerId,
			userId: data.userId,
		})

		if (data.appData) {
			if (data.appData.mediaTag === "user-mic") {
				core.handlers.stopClientMic(data)
			}

			if (data.appData.mediaTag === "screen-video") {
				app.cores.sfx.play("media_video_leave")
			}
		}
	} catch (error) {
		core.console.error("Error handling producer left:", error)
	}
}
