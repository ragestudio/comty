export default async function (ws) {
	ws.send(
		this.codec.encode({
			event: "pong",
		}),
	)
}
