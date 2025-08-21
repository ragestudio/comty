export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["chatChannelsController"],
	fn: async (req, res, ctx) => {
		const { group_id, channel_id } = req.params
		const { limit, beforeId } = req.query

		console.time("lookup channel:")
		const channel = await ctx.chatChannelsController.get(
			group_id,
			channel_id,
			req.auth.session.user_id,
		)
		console.timeEnd("lookup channel:")

		const params = {}

		if (limit) {
			params.limit = parseInt(limit)
		}

		if (beforeId) {
			params.beforeId = beforeId
		}

		return await channel.read({ userId: req.auth.session.user_id }, params)
	},
}
