export default async function (ws, buff, isBinary) {
	try {
		const decoded = this.codec.decode(buff, isBinary)

		const event = this.gateway.events.get(decoded.event)

		if (!event) {
			return ws.send(
				this.codec.encode({
					error: "gateway:handler:error",
					message: "Event not found",
				}),
			)
		}

		if (typeof event.handler === "function") {
			return await event.handler.bind(this)(ws, decoded)
		}

		await this.dispatchToUpstream({
			ws: ws,
			serviceId: event.serviceId,
			event: decoded.event,
			data: Buffer.from(buff),
		})
	} catch (error) {
		console.error("WebSocket message handler error:", error)

		// Send error response
		ws.send(
			this.codec.encode({
				event: "gateway:handler:error",
				error: error.message,
				data: null,
			}),
		)
	}
}
