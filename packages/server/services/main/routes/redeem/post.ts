import type API from "@services/main/main.service"

import Redeem from "@classes/redeem"
import { enforceRedeemRateLimit } from "@classes/redeem/rateLimit"

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

		await enforceRedeemRateLimit(ctx.redis, userId)

		return await Redeem.redeem({
			code,
			user_id: userId,
		})
	},
})
