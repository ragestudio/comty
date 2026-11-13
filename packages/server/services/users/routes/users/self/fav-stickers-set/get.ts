import type API from "@services/users/users.service"

import FavStickersSet from "@db_models/favSticker"
import StickersSet from "@db_models/stickerSet"
import Sticker from "@db_models/sticker"

type RouteQuery = {
	limit?: string
	page?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.auth.session
		const query = req.query as RouteQuery
		const limit = Number(query.limit ?? 10)
		const page = Number(query.page ?? 0)

		// get fav sticker sets with pagination
		const favoritesList = await FavStickersSet.find({ user_id })
			.skip(limit * page)
			.limit(limit)
			.lean()

		if (!favoritesList.length) {
			return { total_items: 0, items: [] }
		}

		const stickerSetIds = favoritesList.map((fav) => fav.stickers_set_id)

		// get sets and stickers in parallel
		const [sets, stickers] = await Promise.all([
			StickersSet.find({ _id: { $in: stickerSetIds } }).lean(),
			Sticker.find({ stickers_set_id: { $in: stickerSetIds } }).lean(),
		])

		// organize stickers by set id
		const stickersBySet = new Map<string, any[]>()

		stickers.forEach((sticker) => {
			if (!stickersBySet.has(sticker.stickers_set_id)) {
				stickersBySet.set(sticker.stickers_set_id, [])
			}

			stickersBySet.get(sticker.stickers_set_id).push(sticker)
		})

		// build final response
		const items = sets.map((set) => ({
			name: set.name,
			items: stickersBySet.get(set._id.toString()) || [],
		}))

		const total = await FavStickersSet.countDocuments({ user_id })

		return { total_items: total, items: items }
	},
})
