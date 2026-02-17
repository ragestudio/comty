export default {
	useContexts: ["groupChannels"],
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

		if (!payload.message_id) {
			throw new OperationError(400, "Missing message_id")
		}

		const channel = await ctx.groupChannels.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)

		return await channel.delete(
			client.user ?? client.socket.context.user,
			payload.message_id,
		)
	},
}
