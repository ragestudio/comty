import { headers } from "nats"

export default (ws) => {
	const upstreamHeaders = headers()

	upstreamHeaders.append("socket_id", ws.socket_id)

	if (ws.token) {
		upstreamHeaders.append("token", ws.token)
	}

	if (ws.session) {
		upstreamHeaders.append("user_id", ws.session.user_id)
		upstreamHeaders.append("username", ws.session.username)
	}

	if (ws.user) {
		upstreamHeaders.append("user", JSON.stringify(ws.user))
	}

	return {
		headers: upstreamHeaders,
	}
}
