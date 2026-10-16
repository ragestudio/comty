import client from "comty.js/core/client"

// the main realtime socket, owned and managed by the comty.js client
export function getSocket() {
	return client.ws.get("main")
}

export default getSocket
