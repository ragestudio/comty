export default {
	useContexts: ["chatChannelsController"],
	fn: async (client, payload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		const channel = await ctx.chatChannelsController.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)

		return await channel.write(client.socket.context.user, payload)
	},
}
