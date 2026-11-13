import type API from "@services/main/main.service"
import StickersSet from "@db_models/stickerSet"

type RouteParams = {
	id: string
}

type RouteBody = {
	name?: string
	thumbnail?: string
	items?: string[]
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { id } = req.params as RouteParams

		// try to fetch the stickers set
		let stickersSet = await StickersSet.findById(id)

		// if not found, throw an error
		if (!stickersSet) {
			throw new OperationError(404, "Stickers set not found")
		}

		// if the user is not the owner, throw an error
		if (stickersSet.owner_user_id !== req.auth.session.user_id) {
			throw new OperationError(403, "You can't edit this stickers set")
		}

		const { name, thumbnail, items } = (req.body ?? {}) as RouteBody

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
})
