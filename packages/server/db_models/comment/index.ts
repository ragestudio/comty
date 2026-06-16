import { defineModel } from "@db_models"

export default defineModel({
	name: "Comment",
	collection: "comments",
	schema: {
		user_id: { type: String, required: true },
		parent_id: { type: String, required: true },
		message: { type: String, required: true },
		created_at: { type: Date, default: Date.now },
	},
})
