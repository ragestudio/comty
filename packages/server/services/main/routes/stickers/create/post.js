import { StickersSet, Sticker } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { stickers_set_id, emoji, file_url, animated, video } = req.body

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
}
