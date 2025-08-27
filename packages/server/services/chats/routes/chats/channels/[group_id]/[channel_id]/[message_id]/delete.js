export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["chatChannelsController"],
	fn: async (req, res, ctx) => {
		const { group_id, channel_id, message_id } = req.params

		const channel = await ctx.chatChannelsController.get(
			group_id,
			channel_id,
			req.auth.session.user_id,
		)

		return await channel.delete(
			{ _id: req.auth.session.user_id },
			message_id,
		)
	},
}
