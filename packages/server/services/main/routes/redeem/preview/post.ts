import type API from "@services/main/main.service"

import Redeem from "@classes/redeem"
import { enforceRedeemRateLimit } from "@classes/redeem/rateLimit"

type RedeemPreviewRequestBody = {
	code?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis"] as const,
	fn: async (req, res, ctx) => {
		const { code } = (req.body ?? {}) as RedeemPreviewRequestBody

		if (!code) {
			throw new OperationError(400, "Missing code")
		}

		const userId = req.auth.session.user_id

		await enforceRedeemRateLimit(ctx.redis, userId)

		return await Redeem.preview({
			code,
			user_id: userId,
		})
	},
})
