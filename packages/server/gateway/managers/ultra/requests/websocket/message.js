import WebsocketProxy from "./index"

export default function (ws, buff, isBinary) {
	try {
		const decoded = WebsocketProxy.decode(buff, isBinary)

		switch (decoded.event) {
			case "ping": {
				ws.send(WebsocketProxy.encode({ event: "pong" }))
				break
			}
			default: {
				// If there's a target service specified, route directly to it
				if (ws.targetService) {
					const child = ws.ws_childrens.get(ws.targetService)

					if (!child) {
						ws.send(
							WebsocketProxy.encode({
								type: "gateway:error",
								error: "Target websocket service not available",
								service: ws.targetService,
							}),
						)
						return null
					}

					console.log(
						`[ultra-ws] main -> ${ws.targetService} (direct):`,
						decoded.event || decoded.type || "message",
					)
					child.sendToChild(buff)
					break
				}

				// Handle broadcast to all services if specified
				if (decoded.broadcast === true) {
					let sentCount = 0
					for (const [serviceId, child] of ws.ws_childrens) {
						console.log(
							`[ultra-ws] main -> ${serviceId} (broadcast):`,
							decoded.event || decoded.type || "message",
						)
						child.sendToChild(buff)
						sentCount++
					}

					if (sentCount === 0) {
						ws.send(
							WebsocketProxy.encode({
								type: "gateway:error",
								error: "No websocket services available for broadcast",
							}),
						)
					}
					break
				}

				// Default event-based routing
				const event = this.gateway.events.get(decoded.event)

				if (!event) {
					ws.send(
						WebsocketProxy.encode({
							type: "gateway:error",
							error: "Event not registered",
						}),
					)
					return null
				}

				const child = ws.ws_childrens.get(event.serviceId)

				if (!child) {
					ws.send(
						WebsocketProxy.encode({
							type: "gateway:error",
							error: "Websocket not available for this service",
							service: event.serviceId,
						}),
					)
					return null
				}

				console.log(
					`[ultra-ws] main -> ${event.serviceId}:`,
					decoded.event,
				)
				child.sendToChild(buff)

				break
			}
		}
	} catch (error) {
		ws.send(
			WebsocketProxy.encode({
				error: "gateway:handler:error",
				data: error,
			}),
		)
	}
}
