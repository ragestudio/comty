export default async function () {
	try {
		this.state.status = "disconnecting"

		this.console.debug("disconnecting rtc websocket")

		// destroy socket
		await this.socket.destroy()

		this.state.status = "disconnected"
	} catch (error) {
		this.console.error("Error disconnecting ws:", error)

		this.state.status = "failed"
	}
}
