export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["dmChannels"],
	fn: async (req, res, ctx) => {
		return await ctx.dmChannels.rooms(req.auth.session.user_id)
	},
}
