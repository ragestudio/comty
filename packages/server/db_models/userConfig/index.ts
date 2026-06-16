import { defineModel } from "@db_models"

export default defineModel({
	name: "UserConfig",
	collection: "user_config",
	schema: {
		user_id: { type: String, required: true },
		values: { type: Object, default: {} },
	},
})
