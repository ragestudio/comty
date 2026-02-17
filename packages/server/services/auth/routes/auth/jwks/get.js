export default {
	useContexts: ["keys"],
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
}
