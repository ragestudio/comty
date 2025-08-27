export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["chatChannelsController"],
	fn: async (req, res, ctx) => {
		const { group_id, channel_id } = req.params
		const { limit, beforeId, afterId } = req.query

		const channel = await ctx.chatChannelsController.get(
			group_id,
			channel_id,
			req.auth.session.user_id,
		)

		const params = {}

		if (limit) {
			params.limit = parseInt(limit)
		}

		if (beforeId) {
			params.beforeId = beforeId
		}

		if (afterId) {
			params.afterId = afterId
		}

		return await channel.read({ _id: req.auth.session.user_id }, params)
	},
}
