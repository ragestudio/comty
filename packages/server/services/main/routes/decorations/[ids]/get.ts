import type API from "@services/main/main.service"
import Decorations from "@db_models/decorations"

type RouteParams = {
	ids: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { ids } = req.params as RouteParams

		const idsList = ids.split(",")

		return await Decorations.find({ _id: { $in: idsList } })
	},
})
