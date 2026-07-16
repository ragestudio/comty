import { defineModel } from "@db_models"

export default defineModel({
	name: "PostSave",
	collection: "post_saves",
	schema: {
		post_id: {
			type: "string",
			required: true,
		},
		user_id: {
			type: "string",
			required: true,
		},
		saved_at: {
			type: "date",
			default: Date.now,
		},
	},
})
