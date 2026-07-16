import type API from "@services/auth/auth.service"

export default defineRoute<API>()({
	useContexts: ["oauth"] as const,
	fn: async (req, res, ctx) => {
		const authHeader = req.headers["authorization"]

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new OperationError(401, "missing authorization header")
		}

		const token = authHeader.slice(7)

		try {
			return await ctx.oauth.getUserInfo(token)
		} catch (err) {
			throw new OperationError(401, err.message)
		}
	},
})
