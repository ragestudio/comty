import type API from "@services/auth/auth.service"
import type { OidcApp } from "@db_models/oidc_apps"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const {
			client_id,
			redirect_uri,
			response_type,
			scope,
			state,
			code_challenge,
			code_challenge_method,
		} = req.query

		const { action } = req.body || {}

		if (!client_id || !redirect_uri || !response_type) {
			throw new OperationError(400, "missing required parameters")
		}

		const client = (await ctx.oauth.validateClient(
			client_id,
		)) as OidcApp | null

		if (!client) {
			throw new OperationError(400, "invalid_client")
		}

		const allowedUris = client.redirect_uris || []

		if (!allowedUris.includes(redirect_uri)) {
			throw new OperationError(400, "invalid_redirect_uri")
		}

		const redirectParams = new URLSearchParams()

		if (state) {
			redirectParams.set("state", state)
		}

		if (action === "approve") {
			if (!client.production) {
				if (req.auth.user_id !== client.owner_id) {
					throw new OperationError(
						403,
						"Not production apps can not be used by non-owners",
					)
				}
			}

			const code = await ctx.oauth.createAuthorizationCode({
				client_id: client_id,
				user_id: req.auth.user_id,
				redirect_uri: redirect_uri,
				scope: scope || "",
				code_challenge: code_challenge,
				code_challenge_method: code_challenge_method,
			})

			redirectParams.set("code", code)
		} else {
			redirectParams.set("error", "access_denied")
		}

		const separator = redirect_uri.includes("?") ? "&" : "?"

		return {
			redirect_uri: `${redirect_uri}${separator}${redirectParams.toString()}`,
			code: redirectParams.get("code") || null,
		}
	},
})
