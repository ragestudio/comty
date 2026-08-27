import type API from "@services/groups/groups.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "usersConnections"] as const,
	fn: async (req, res, ctx) => {
		if (!req.query.users_id || typeof req.query.users_id !== "string") {
			return {}
		}

		// TODO: check if the users_id is actually in the group
		const users_id = req.query.users_id.split(",")

		return await ctx.usersConnections.isUsersConnected(users_id)
	},
})
