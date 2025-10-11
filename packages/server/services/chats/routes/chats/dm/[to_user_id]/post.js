export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["directMessagesController"],
	fn: async (req, res, ctx) => {
		const { to_user_id } = req.params
		const user = await req.auth.user()

		const room = await ctx.directMessagesController.get(
			user._id.toString(),
			to_user_id,
		)

		return await room.write(user, req.body)
	},
}
