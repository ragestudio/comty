export default async function (message, payload) {
	const { user_id } = payload.data

	let clients = []

	if (typeof user_id === "string") {
		const ids = this.userIdRefs.get(user_id) ?? []

		for (const id of ids) {
			const client = this.clients.get(id)

			if (client) {
				clients.push(client)
			}
		}
	}

	return message.respond(
		this.codec.encode({
			ok: true,
			data: clients,
		}),
	)
}
