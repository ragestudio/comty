import { defineModel } from "@db_models"

export default defineModel({
	name: "Decorations",
	collection: "decorations",
	schema: {
		name: {
			type: String,
		},
		type: {
			type: String,
			index: true,
		},
		image_obj: {
			type: String,
		},
		enabled: {
			type: Boolean,
			default: true,
		},
		deleted_at: {
			type: Date,
			default: null,
		},
		obj_url: {
			type: String,
		},
		preview_url: {
			type: String,
		},
		style: {
			type: Object,
		},
		card_style: {
			type: Object,
		},
		image_obj_style: {
			type: Object,
		},
		gradient_obj: {
			type: Object,
		},
		theme_color_values: {
			type: Object,
		},
	},
})
