import type API from "@services/main/main.service"

import Redeem from "@classes/redeem"

type RedeemRequestBody = {
	code?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis"] as const,
	fn: async (req, res, ctx) => {
		const { code } = (req.body ?? {}) as RedeemRequestBody

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
})
