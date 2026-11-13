import type API from "@services/main/main.service"
import LimitsClass from "@shared-classes/Limits"

type RouteQuery = {
	key?: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { key } = req.query as RouteQuery

		return await LimitsClass.get(key)
	},
})
