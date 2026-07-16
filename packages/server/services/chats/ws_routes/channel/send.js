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

		console.time("get-channel")
		const channel = await ctx.groupChannels.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)
		console.timeEnd("get-channel")

		console.time("write-channel")
		await channel.write(client.user ?? client.socket.context.user, payload)
		console.timeEnd("write-channel")
	},
}
