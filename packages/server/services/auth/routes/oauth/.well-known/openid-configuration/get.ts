import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	fn: async (req, res) => {
		const baseUrl =
			process.env.OIDC_ISSUER_URL || `http://indev-api.comty.app`

		return {
			issuer: baseUrl,
			authorization_endpoint: `https://indev.comty.app/oauth`,
			token_endpoint: `${baseUrl}/oauth/token`,
			userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
			jwks_uri: `${baseUrl}/jwks`,
			scopes_supported: ["openid", "profile", "email"],
			response_types_supported: ["code"],
			grant_types_supported: ["authorization_code", "refresh_token"],
			token_endpoint_auth_methods_supported: ["client_secret_post"],
			code_challenge_methods_supported: ["S256", "plain"],
			claims_supported: ["sub", "email", "username", "name", "flags"],
		}
	},
})
