import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useContexts: ["keys"] as const,
	fn: async (req, res, ctx) => {
		return {
			keys: [
				{
					...ctx.keys.jwk,
					kid: process.env.JWT_KID,
					use: "sig",
					alg: "ES256",
				},
			],
		}
	},
})
