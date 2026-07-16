import { defineModel } from "@db_models"

export default defineModel({
	name: "PostLike",
	collection: "post_likes",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		post_id: {
			type: String,
			required: true,
		},
	},
})
