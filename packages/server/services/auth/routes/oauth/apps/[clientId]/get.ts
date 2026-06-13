import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const { clientId } = req.params

		const client = await ctx.oauth.validateClient(clientId)

		if (!client) {
			throw new OperationError(404, "client not found")
		}

		return {
			client_id: client.client_id,
			client_name: client.client_name,
			redirect_uris: client.redirect_uris,
		}
	},
})
