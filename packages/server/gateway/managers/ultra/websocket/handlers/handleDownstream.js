export default function (message) {
	// get the socket_id from the message headers
	const socket_id = message.headers.get("socket_id")

	if (!socket_id) {
		return null
	}

	// get the websocket socket from the map
	const socket = this.clients.get(socket_id)

	if (!socket) {
		return null
	}

	if (socket.closed) {
		return null
	}

	socket.send(message.data)
}
