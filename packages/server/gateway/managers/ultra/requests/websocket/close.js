export default function (ws, code, message) {
	try {
		ws.closed = true

		for (const [_serviceId, socket] of ws.ws_childrens) {
			socket.destroy()
		}
	} catch (error) {
		console.error(error)
	}
}
