import { defineModel } from "@db_models"

export default defineModel({
	name: "InventoryItem",
	collection: "inventory_items",
	schema: {
		user_id: {
			type: String,
			required: true,
			index: true,
		},
		kind: {
			type: String,
			required: true,
			enum: ["decoration", "badge"],
			index: true,
		},
		item_id: {
			type: String,
			required: true,
		},
		source: {
			type: String,
			default: "system",
		},
		granted_by: {
			type: String,
			default: null,
		},
		granted_at: {
			type: Date,
			default: Date.now,
		},
		metadata: {
			type: Object,
		},
	},
	indexes: [
		{
			fields: { user_id: 1, kind: 1, item_id: 1 },
			options: { unique: true },
		},
		{
			fields: { kind: 1, item_id: 1 },
		},
	],
})
