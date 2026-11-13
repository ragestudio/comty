import type API from "@services/main/main.service"
import StickersSet from "@db_models/stickerSet"
import FavStickersSet from "@db_models/favSticker"

type RouteBody = {
	name?: string
	thumbnail?: string
	items?: string[]
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { name, thumbnail, items } = (req.body ?? {}) as RouteBody

		if (!name) {
			throw new OperationError(400, "Name is required")
		}

		let stickersSet = await StickersSet.findOne({
			name: name.trim(),
			owner_user_id: req.auth.session.user_id,
		})

		if (stickersSet) {
			throw new OperationError(
				400,
				"Stickers set with this name already exists",
			)
		}

		stickersSet = new StickersSet({
			name: name.trim(),
			thumbnail: thumbnail,
			items: Array.isArray(items) ? items : [],
			owner_user_id: req.auth.session.user_id,
		})

		await stickersSet.save()

		await FavStickersSet.create({
			user_id: req.auth.session.user_id,
			stickers_set_id: stickersSet._id.toString(),
		})

		return stickersSet
	},
})
