import type API from "@services/chats/chats.service"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["dmChannels"] as const,
	fn: async (req, res, ctx) => {
		const user_id = req.auth.session.user_id

		return await ctx.dmChannels.rooms(user_id)
	},
})
