import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const apps = await ctx.oauth.getUserApps(req.auth.user_id)

		return apps.map((app) => ({
			client_id: app.client_id,
			client_name: app.client_name,
			redirect_uris: app.redirect_uris,
		}))
	},
})
