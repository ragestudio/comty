import type API from "@services/users/users.service"

type RouteParams = { user_id: string }

export default defineRoute<API>()({
	useContexts: ["redis", "usersConnections"] as const,
	fn: async (req, res, ctx) => {
		const { user_id } = req.params as RouteParams

		const isMultiple = user_id.includes(",")

		if (isMultiple) {
			return await ctx.usersConnections.isUsersConnected(
				user_id.split(",").map((id) => id.trim()),
			)
		}

		return await ctx.usersConnections.isUserConnected(user_id)
	},
})
