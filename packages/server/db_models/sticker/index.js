export default {
	name: "Sticker",
	collection: "stickers",
	schema: {
		stickers_set_id: { type: String, required: true },
		emoji: { type: String, required: true },
		file_url: { type: String, required: true },
		animated: { type: Boolean, required: true },
		video: { type: Boolean, required: true },
	},
}
