import type API from "@services/main/main.service"
import StickersSet from "@db_models/stickerSet"
import Sticker from "@db_models/sticker"

type RouteBody = {
	stickers_set_id: string
	emoji: string
	file_url: string
	animated?: boolean
	video?: boolean
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { stickers_set_id, emoji, file_url, animated, video } =
			(req.body ?? {}) as RouteBody

		if (!stickers_set_id) {
			throw new OperationError(400, "stickers_set_id id is required")
		}

		if (!emoji) {
			throw new OperationError(400, "Emoji is required")
		}

		// try to fetch the stickers set
		let stickersSet = await StickersSet.findOne({
			_id: stickers_set_id,
		})

		// if not found, throw an error
		if (!stickersSet) {
			throw new OperationError(400, "Stickers set not found")
		}

		// create the sticker object
		const sticker = new Sticker({
			stickers_set_id: stickers_set_id,
			emoji: emoji,
			file_url: file_url,
			animated: animated ?? false,
			video: video ?? false,
		})

		// save the sticker
		await sticker.save()

		// update the stickers set with the new sticker id pushed to the items array
		stickersSet.items.push(sticker._id.toString())

		// save the stickers set update
		await stickersSet.save()

		return sticker
	},
})
