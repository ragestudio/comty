export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["chatChannelsController"],
	fn: async (req, res, ctx) => {
		const { group_id, channel_id } = req.params

		const userData = await req.auth.user()

		const channel = await ctx.chatChannelsController.get(
			group_id,
			channel_id,
			req.auth.session.user_id,
		)

		return await channel.write(userData, req.body)
	},
}
