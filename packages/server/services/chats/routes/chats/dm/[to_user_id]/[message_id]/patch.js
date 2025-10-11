export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["directMessagesController"],
	fn: async (req, res, ctx) => {
		const { to_user_id, message_id } = req.params

		const room = await ctx.directMessagesController.get(
			req.auth.session.user_id,
			to_user_id,
		)

		return await room.update(
			{ _id: req.auth.session.user_id },
			message_id,
			req.body,
		)
	},
}
