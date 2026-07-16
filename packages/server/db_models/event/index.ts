import { defineModel } from "@db_models"

export default defineModel({
	name: "Event",
	collection: "events",
	schema: {
		name: { type: String, required: true },
		category: { type: String },
		description: { type: String },
		announcement: { type: Object, required: true },
		location: { type: String },
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		featured: { type: Boolean, default: false },
		pageConfig: { type: Object, default: {} },
	},
})
