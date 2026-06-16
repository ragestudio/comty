import { defineModel } from "@db_models"

export default defineModel({
	name: "ServerKeys",
	collection: "server_keys",
	schema: {
		access_id: {
			type: String,
			required: true,
		},
		secret_token: {
			type: String,
			required: true,
			select: false,
		},
		access: {
			type: Array,
			default: [],
		},
		name: {
			type: String,
		},
		description: {
			type: String,
		},
		owner_user_id: {
			type: String,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
})
