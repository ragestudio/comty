import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const {
			grant_type,
			code,
			redirect_uri,
			client_id,
			client_secret,
			refresh_token,
			code_verifier,
		} = req.body

		try {
			if (grant_type === "authorization_code") {
				if (!code || !redirect_uri || !client_id || !client_secret) {
					return { error: "invalid_request" }
				}

				const result = await ctx.oauth.exchangeCode({
					code,
					client_id,
					client_secret,
					redirect_uri,
					code_verifier,
				})

				return result
			}

			if (grant_type === "refresh_token") {
				if (!refresh_token) {
					return { error: "invalid_request" }
				}

				const result = await ctx.oauth.refreshAccessToken(refresh_token)
				return result
			}

			return { error: "unsupported_grant_type" }
		} catch (err) {
			return { error: "invalid_grant", error_description: err.message }
		}
	},
})
