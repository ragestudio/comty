export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["directMessagesController"],
	fn: async (req, res, ctx) => {
		return await ctx.directMessagesController.rooms(
			req.auth.session.user_id,
		)
	},
}
