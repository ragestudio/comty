import { defineModel } from "@db_models"

export default defineModel({
	name: "StickersSet",
	collection: "stickers_set",
	schema: {
		name: { type: String, required: true },
		items: { type: Array, required: true },
		owner_user_id: { type: String, required: true },
	},
})
