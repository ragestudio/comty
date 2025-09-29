import { Empty } from "nats"

export default async function (ws) {
	try {
		// add the socket to map
		this.clients.set(ws.socket_id, ws)

		// send to the client the connected event
		ws.send(
			this.codec.encode({
				event: "gateway:connected",
			}),
		)

		// if no user session available, notify client
		if (!ws.session) {
			ws.send(
				this.codec.encode({
					event: "gateway:user:unauthorized",
				}),
			)
		}

		// if user session available, append user_id to id refs & notify client
		if (ws.session) {
			let userRefs = this.userIdRefs.get(ws.session.user_id) ?? new Set()

			userRefs.add(ws.socket_id)
			this.userIdRefs.set(ws.session.user_id, userRefs)

			ws.send(
				this.codec.encode({
					event: "gateway:user:authed",
					data: {
						user_id: ws.session.user_id,
					},
				}),
			)
		}

		// send to all services
		this.dispatchToUpstream({
			ws: ws,
			serviceId: Array.from(this.gateway.websocketServices.keys()),
			event: "socket:connected",
			data: Empty,
		})
	} catch (error) {
		console.error(error)
	}
}
