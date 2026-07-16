import { defineModel } from "@db_models"

export default defineModel({
	name: "Decorations",
	collection: "decorations",
	schema: {
		image_obj: {
			type: String,
		},
	},
})
