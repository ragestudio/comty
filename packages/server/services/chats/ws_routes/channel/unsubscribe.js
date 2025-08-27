export default {
	fn: async (client, payload) => {
		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		await client.unsubscribe(`chats:channel:${payload.channel_id}`)
	},
}
