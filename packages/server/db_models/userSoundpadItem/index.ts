import { defineModel } from "@db_models"

export default defineModel({
	name: "UserSoundpadItem",
	collection: "user_soundpad_items",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		src: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
	indexes: [
		{
			fields: { user_id: 1, created_at: -1 },
		},
		{
			fields: { user_id: 1, src: 1 },
			options: { unique: true },
		},
	],
})
