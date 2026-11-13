import type API from "@services/main/main.service"
import Sticker from "@db_models/sticker"

type RouteParams = {
	id: string
}

type RouteQuery = {
	data?: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { id } = req.params as RouteParams
		const { data } = req.query as RouteQuery

		let sticker = await Sticker.findOne({ _id: id }).lean()

		if (!sticker) {
			throw new OperationError(404, "Sticker not found")
		}

		if (ToBoolean(data) && sticker.animated) {
			const result = await fetch(sticker.file_url)

			if (!result.ok) {
				throw new OperationError(500, "Failed to fetch sticker data")
			}

			sticker.data = await result.json()
		}

		return sticker
	},
})
