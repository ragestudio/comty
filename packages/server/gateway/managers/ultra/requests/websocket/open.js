import WebsocketProxy from "./index"
import WebsocketChild from "./child"

export default function (ws) {
	try {
		ws.ws_childrens = new Map()

		ws.send(
			WebsocketProxy.encode({
				event: "gateway:connected",
				targetService: ws.targetService || null,
				namespace: ws.namespace || null,
			}),
		)

		// If a target service is specified, only connect to that service
		if (ws.targetService) {
			const targetParams = this.gateway.websockets.get(ws.targetService)

			if (targetParams) {
				const child = new WebsocketChild(ws, {
					serviceId: ws.targetService,
					...targetParams,
				})
				child.connect()
			} else {
				ws.send(
					WebsocketProxy.encode({
						event: "gateway:error",
						error: "Target service not found",
						service: ws.targetService,
					}),
				)
			}
		} else {
			// Default behavior: connect to all websocket services
			for (let [_serviceId, params] of this.gateway.websockets) {
				const child = new WebsocketChild(ws, params)
				child.connect()
			}
		}
	} catch (error) {
		console.error(error)
	}
}
