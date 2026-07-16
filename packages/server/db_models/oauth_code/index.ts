import { defineModel } from "@db_models"

export default defineModel({
	name: "OauthCode",
	collection: "oauth_codes",
	schema: {
		code: { type: String, required: true, unique: true, index: true },
		client_id: { type: String, required: true },
		user_id: { type: String, required: true },
		redirect_uri: { type: String, required: true },
		scope: { type: String, default: "" },
		code_challenge: { type: String },
		code_challenge_method: { type: String },
		expiresAt: { type: Date, required: true, index: true },
		used: { type: Boolean, default: false },
	},
})
