import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		let { client_name, redirect_uris } = req.body

		if (typeof redirect_uris === "string") {
			redirect_uris = redirect_uris.split(",")
		}

		if (!client_name || !redirect_uris || !Array.isArray(redirect_uris)) {
			throw new OperationError(
				400,
				"client_name and redirect_uris are required",
			)
		}

		const app = await ctx.oauth.registerApp(req.auth.user_id, {
			client_name,
			redirect_uris,
		})

		return app
	},
})
