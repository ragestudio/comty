export default async (core, data) => {
	try {
		core.state.clients.push({
			userId: data.userId,
			voiceState: data.voiceState,
		})

		app.cores.sfx.play("media_channel_join")

		core.console.log("New client joined to channel:", data)
	} catch (error) {
		core.console.error("Error handling client joined:", error)
	}
}
