import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const { clientId } = req.params
		const { client_name, redirect_uris } = req.body

		try {
			const app = await ctx.oauth.updateApp(req.auth.user_id, clientId, {
				client_name,
				redirect_uris,
			})

			return app
		} catch (err) {
			throw new OperationError(404, err.message)
		}
	},
})
