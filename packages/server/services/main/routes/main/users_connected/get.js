import UserConnections from "@shared-classes/UserConnections"

export default {
	useContexts: ["redis"],
	fn: async (req, res, ctx) => {
		const { limit, offset } = req.query

		return await UserConnections.getAllConnectedUsers(ctx.redis.client, {
			offset: offset,
			limit: limit,
		})
	},
}
