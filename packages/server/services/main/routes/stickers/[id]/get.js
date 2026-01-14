import { Sticker } from "@db_models"

export default {
	fn: async (req) => {
		let sticker = await Sticker.findOne({ _id: req.params.id }).lean()

		if (!sticker) {
			throw new OperationError(404, "Sticker not found")
		}

		if (ToBoolean(req.query.data) && sticker.animated) {
			const result = await fetch(sticker.file_url)

			if (!result.ok) {
				throw new OperationError(500, "Failed to fetch sticker data")
			}

			sticker.data = await result.json()
		}

		return sticker
	},
}
