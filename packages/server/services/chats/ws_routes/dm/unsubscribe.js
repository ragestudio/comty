export default {
	useContexts: ["directMessagesController"],
	fn: async (client, payload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.to_user_id) {
			throw new OperationError(400, "Missing to_user_id")
		}

		const from_user_id = client.userId
		const to_user_id = payload.to_user_id

		const room = await ctx.directMessagesController.get(
			from_user_id,
			to_user_id,
		)

		await client.unsubscribe(`chat:dm:${room._id}`)
	},
}
