export default async function () {
	try {
		if (this.ui) {
			this.ui.detach()
		}

		if (this.screens.size > 0) {
			this.ui.detachFloatingScreens()

			for (const screen of this.screens.values()) {
				screen.stop()
			}

			this.screens.clear()
		}

		// close transports
		if (this.sendTransport && !this.sendTransport.closed) {
			this.sendTransport.close()
		}
		if (this.recvTransport && !this.recvTransport.closed) {
			this.recvTransport.close()
		}

		// stop all devices
		await this.self.stopAll()

		// stop all consumers
		await this.consumers.stopAll()

		// destroy all clients
		await this.clients.destroyAll()

		if (!this.state.isJoined) {
			return null
		}

		this.console.debug("Leaving channel:", {
			channelId: this.state.channelId,
		})

		app.cores.sfx.play("media_channel_leave")

		// clear device
		this.device = null

		// default state
		this.state.isJoined = false
		this.state.isLoading = false
		this.state.channelId = null
		this.state.channel = null

		// call socket to leave
		await this.socket.call("channel:leave")
	} catch (error) {
		this.console.error("Error leaving channel:", error)

		app.cores.notifications.new({
			title: "Failed to leave channel",
			message: error.message,
			type: "error",
		})
	}
}
