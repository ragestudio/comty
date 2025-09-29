import { Empty } from "nats"

export default async function (ws) {
	try {
		ws.closed = true

		this.clients.delete(ws.socket_id)

		if (ws.session) {
			// remove websocket id from user refs
			let userRefs = this.userIdRefs.get(ws.session.user_id)

			if (userRefs) {
				userRefs.delete(ws.socket_id)
				this.userIdRefs.set(ws.session.user_id, userRefs)
			}
		}

		// send to all services
		this.dispatchToUpstream({
			ws: ws,
			serviceId: Array.from(this.gateway.websocketServices.keys()),
			event: "socket:disconnected",
			data: Empty,
		})
	} catch (error) {
		console.error(error)
	}
}
