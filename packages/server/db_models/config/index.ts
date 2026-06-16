import { defineModel } from "@db_models"

export default defineModel({
	name: "Config",
	collection: "config",
	schema: {
		key: {
			type: String,
			required: true,
		},
		value: {
			// type can be anything
			type: Object,
			required: true,
		},
	},
})
