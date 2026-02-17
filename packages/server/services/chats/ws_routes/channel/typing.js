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

		const channel = await ctx.groupChannels.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)

		const userData = client.user ?? client.socket.context.user

		await channel.sendEventToChannelTopic("channel:typing", {
			user_id: client.userId,
			user: {
				_id: userData._id,
				username: userData.username,
				avatar: userData.avatar,
			},
			group_id: channel.channel.group_id.toString(),
			channel_id: channel.channel._id.toString(),
			isTyping: payload.isTyping,
		})

		return true
	},
}
