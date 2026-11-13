import type API from "@services/main/main.service"
import Redeem from "@classes/redeem"

type RouteQuery = {
	limit?: string | number
	offset?: string | number
	enabled?: string | boolean
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { limit, offset, enabled } = req.query as RouteQuery

		return await Redeem.listCodes({
			limit,
			offset,
			enabled,
		})
	},
})
