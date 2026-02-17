export default {
	fn: async (client, payload) => {
		const clients = await client.engine.find.clientsByUserId(
			payload.user_id,
		)

		return clients.map((client) => client.id)
	},
}
