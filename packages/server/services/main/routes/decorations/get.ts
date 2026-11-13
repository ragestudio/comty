import type API from "@services/main/main.service"
import Decorations from "@db_models/decorations"

type RouteQuery = {
	type?: string
	slot?: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { type, slot } = req.query as RouteQuery

		const query: Record<string, any> = {
			enabled: { $ne: false },
		}

		const slotType = type ?? slot

		if (slotType) {
			query.type = slotType
		}

		return await Decorations.find(query).sort({ name: 1 }).lean()
	},
})
