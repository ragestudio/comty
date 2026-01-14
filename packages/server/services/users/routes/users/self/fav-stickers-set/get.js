import { FavStickersSet, StickersSet, Sticker } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.auth.session
		const { limit = 10, page = 0 } = req.query

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
		const stickersBySet = new Map()

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
}
