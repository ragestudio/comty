import type API from "@services/main/main.service"
import Redeem from "@classes/redeem"

type RouteParams = {
	code_id: string
}

type RouteQuery = {
	limit?: string | number
	offset?: string | number
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { code_id } = req.params as RouteParams
		const { limit, offset } = req.query as RouteQuery

		return await Redeem.getRedemptions(code_id, {
			limit,
			offset,
		})
	},
})
