import { defineModel } from "@db_models"

export default defineModel({
	name: "UserTotp",
	collection: "user_totp",
	schema: {
		user_id: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		encrypted_secret: {
			type: String,
			required: true,
		},
		iv: {
			type: String,
			required: true,
		},
		auth_tag: {
			type: String,
			required: true,
		},
		enabled: {
			type: Boolean,
			default: false,
		},
	},
})
