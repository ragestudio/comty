export default {
	useContexts: ["redis", "usersConnections"],
	fn: async (req, res, ctx) => {
		const isMultiple = req.params.user_id.includes(",")

		if (isMultiple) {
			return await ctx.usersConnections.isUsersConnected(
				req.params.user_id.split(",").map((id) => id.trim()),
			)
		}

		return await ctx.usersConnections.isUserConnected(req.params.user_id)
	},
}
