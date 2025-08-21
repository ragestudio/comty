import UserConnections from "@shared-classes/UserConnections"

export default {
	useContexts: ["redis"],
	fn: async (req, res, ctx) => {
		const isMultiple = req.params.user_id.includes(",")

		if (isMultiple) {
			return await UserConnections.isUsersConnected(
				ctx.redis.client,
				req.params.user_id.split(",").map((id) => id.trim()),
			)
		}

		return await UserConnections.isUserConnected(
			ctx.redis.client,
			req.params.user_id,
		)
	},
}
