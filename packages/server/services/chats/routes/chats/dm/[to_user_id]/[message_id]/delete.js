export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["dmChannels"],
	fn: async (req, res, ctx) => {
		const { to_user_id, message_id } = req.params

		const room = await ctx.dmChannels.get(
			req.auth.session.user_id,
			to_user_id,
		)

		return await room.delete({ _id: req.auth.session.user_id }, message_id)
	},
}
