export default async function () {
	try {
		if (!this.state.isJoined) {
			this.console.warn("No channel to leave")
			return null
		}

		this.console.log("Leaving channel:", {
			channelId: this.state.channelId,
		})

		app.cores.sfx.play("media_channel_leave")

		if (this.ui) {
			this.ui.detach()
		}

		// stop producers
		await this.self.stopMicProducer()
		await this.self.stopScreenProducer()

		// stop local streams
		await this.self.destroyMicStream()
		await this.self.destroyScreenStream()

		// destroy all consumers&producers&clients
		await this.consumers.stopAll()
		await this.clients.destroyAll()
		this.producers.clear()

		// close transports
		if (this.sendTransport && !this.sendTransport.closed) {
			this.sendTransport.close()
		}
		if (this.recvTransport && !this.recvTransport.closed) {
			this.recvTransport.close()
		}

		// call socket to leave
		await this.socket.call("channel:leave")

		// clear device
		this.device = null

		// default state
		this.state.isJoined = false
		this.state.isLoading = false
		this.state.channelId = null
		this.state.channel = null

		this.console.log("Left channel", {
			channelId: this.state.channelId,
		})
	} catch (error) {
		this.console.error("Error leaving channel:", error)

		app.cores.notifications.new({
			title: "Failed to leave channel",
			message: error.message,
			type: "error",
		})
	}
}
