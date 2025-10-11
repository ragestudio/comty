export default {
	useContexts: ["directMessagesController"],
	fn: async (client, payload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.to_user_id) {
			throw new OperationError(400, "Missing to_user_id")
		}

		if (!payload.message_id) {
			throw new OperationError(400, "Missing message_id")
		}

		const from_user_id = client.userId
		const to_user_id = payload.to_user_id

		const channel = await ctx.directMessagesController.get(
			from_user_id,
			to_user_id,
		)

		return await channel.delete(
			client.user ?? client.socket.context.user,
			payload.message_id,
		)
	},
}
