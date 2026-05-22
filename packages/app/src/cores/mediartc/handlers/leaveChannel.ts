import MediaRTC from "../mediartc.core"
import MediaRTCState from "../classes/State"

export default async function (this: MediaRTC) {
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

		// clear producers just in case
		this.producers.clear()

		try {
			// call socket to leave
			if (this.state.isDm) {
				this.socket?.call("call:leave")
			} else {
				this.socket?.call("channel:leave")
			}
		} catch (error: any) {
			this.console.error("Error leaving channel:", error)
		}

		// reset default state
		this.state = Object.assign(this.state, MediaRTCState.defaultState)
	} catch (error: any) {
		this.console.error("Error leaving channel:", error)

		app.cores.notifications.new({
			title: "Failed to leave channel",
			message: error.message,
			type: "error",
		})
	}
}
