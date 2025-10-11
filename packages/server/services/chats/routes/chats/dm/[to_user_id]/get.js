export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["directMessagesController"],
	fn: async (req, res, ctx) => {
		const { limit, beforeId, afterId } = req.query

		const from_user_id = req.auth.session.user_id
		const to_user_id = req.params.to_user_id

		const channel = await ctx.directMessagesController.get(
			from_user_id,
			to_user_id,
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

		return await channel.read({ _id: from_user_id }, params)
	},
}
