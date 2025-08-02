export default async (core, data) => {
	try {
		const clientIndex = core.state.clients.findIndex((client) => {
			return client.userId === data.userId
		})

		if (clientIndex === -1) {
			core.console.error("Client left from channel, but not in list:", data)
			return null
		}

		core.state.clients.splice(clientIndex, 1)

		app.cores.sfx.play("media_channel_leave")

		core.console.debug("Client left from channel:", data)
	} catch (error) {
		core.console.error("Error handling client joined:", error)
	}
}
