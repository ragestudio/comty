import type API from "@services/main/main.service"

type RouteQuery = {
	limit?: string
	offset?: string
}

export default defineRoute<API>()({
	useContexts: ["redis", "userConnections"] as const,
	fn: async (req, res, ctx) => {
		const { limit, offset } = req.query as RouteQuery

		return await ctx.userConnections.getAllConnectedUsers({
			offset: Number(offset ?? 0),
			limit: Number(limit ?? 250),
		})
	},
})
