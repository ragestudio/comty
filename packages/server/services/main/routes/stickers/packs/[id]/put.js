import { StickersSet } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		// try to fetch the stickers set
		let stickersSet = await StickersSet.findById(req.params.id)

		// if not found, throw an error
		if (!stickersSet) {
			throw new OperationError(404, "Stickers set not found")
		}

		// if the user is not the owner, throw an error
		if (stickersSet.owner_user_id !== req.auth.session.user_id) {
			throw new OperationError(403, "You can't edit this stickers set")
		}

		const { name, thumbnail, items } = req.body

		if (name) {
			stickersSet.name = name.trim()
		}

		if (thumbnail) {
			stickersSet.thumbnail = thumbnail
		}

		if (items) {
			stickersSet.items = Array.isArray(items) ? items : []
		}

		await stickersSet.save()

		return stickersSet
	},
}
