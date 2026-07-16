import { defineModel } from "@db_models"

export default defineModel({
	name: "OidcStore",
	collection: "oidc_store",
	schema: {
		id: { type: String, required: true, unique: true, index: true },
		type: { type: String, required: true, index: true },
		payload: { type: String, required: true },
		grantId: { type: String, index: true },
		uid: { type: String, index: true },
		userCode: { type: String, index: true },
		consumedAt: { type: Date },
		expiresAt: { type: Date, index: true },
	},
})
