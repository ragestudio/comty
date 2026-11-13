import type API from "@services/main/main.service"
import Redeem from "@classes/redeem"
import type { Reward } from "@classes/redeem/rewards"

type CreateCodeBody = {
	rewards: Reward[]
	max_uses?: number
	starts_at?: Date | string
	expires_at?: Date | string
	metadata?: Record<string, any>
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const body = (req.body ?? {}) as CreateCodeBody

		return await Redeem.createCode({
			...body,
			created_by: req.auth.session.user_id,
		})
	},
})
