import type API from "@services/chats/chats.service"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["dmChannels"] as const,
	fn: async (req, res, ctx) => {
		return await ctx.dmChannels.rooms(req.auth.session.user_id)
	},
})
