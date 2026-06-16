import { defineModel } from "@db_models"

export default defineModel({
	name: "UserFollow",
	collection: "follows",
	schema: {
		user_id: { type: String, required: true },
		to: { type: String, required: true },
	},
})
