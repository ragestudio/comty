import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis"],
	fn: async (req, res, ctx) => {
		const { code } = req.body ?? {}

		if (!code) {
			throw new OperationError(400, "Missing code")
		}

		const userId = req.auth.session.user_id
		const rateLimitKey = `redeem:attempts:${userId}`

		try {
			const attempts = await ctx.redis.client.incr(rateLimitKey)

			if (attempts === 1) {
				await ctx.redis.client.expire(rateLimitKey, 600)
			}

			if (attempts > 20) {
				throw new OperationError(
					429,
					"Too many attempts, please try again later",
				)
			}
		} catch (error) {
			if (error instanceof OperationError) {
				throw error
			}

			console.error("Failed to apply redeem rate limit", error)
		}

		return await Redeem.redeem({
			code,
			user_id: userId,
		})
	},
}
