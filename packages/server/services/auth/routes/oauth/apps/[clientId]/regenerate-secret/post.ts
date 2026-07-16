import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const { clientId } = req.params

		try {
			return await ctx.oauth.regenerateSecret(req.auth.user_id, clientId)
		} catch (err) {
			throw new OperationError(404, err.message)
		}
	},
})
