export default async function (message, payload) {
	const { topic } = payload.data

	const socket_id = message.headers.get("socket_id")

	if (!socket_id) {
		return message.respond(
			this.codec.encode({ ok: false, error: "Missing socket_id" }),
		)
	}

	const client = await this.clients.get(socket_id)

	if (!client) {
		return message.respond(
			this.codec.encode({ ok: false, error: "Client not found" }),
		)
	}

	try {
		await client.subscribe(topic)

		return message.respond(this.codec.encode({ ok: true }))
	} catch (error) {
		console.error(error)
		return message.respond(
			this.codec.encode({ ok: false, error: error.message }),
		)
	}
}
