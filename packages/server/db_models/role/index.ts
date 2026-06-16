import { defineModel } from "@db_models"

export default defineModel({
	name: "Role",
	collection: "roles",
	schema: {
		name: {
			type: String,
		},
		description: {
			type: String,
		},
		apply: {
			type: Object,
		},
	},
})
