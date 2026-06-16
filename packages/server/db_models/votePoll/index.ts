import { defineModel } from "@db_models"

export default defineModel({
	name: "VotePoll",
	collection: "votes_poll",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		post_id: {
			type: String,
			required: true,
		},
		option_id: {
			type: String,
			required: true,
		},
	},
})
