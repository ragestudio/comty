export default {
	useContexts: ["redis", "userConnections"],
	fn: async (req, res, ctx) => {
		const { limit, offset } = req.query

		return await ctx.userConnections.getAllConnectedUsers({
			offset: offset,
			limit: limit,
		})
	},
}
