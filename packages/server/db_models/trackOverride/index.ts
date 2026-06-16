import { defineModel } from "@db_models"

export default defineModel({
	name: "TrackOverride",
	collection: "track_overrides",
	schema: {
		track_id: {
			type: String,
			required: true,
		},
		service: {
			type: String,
		},
		override: {
			type: Object,
			required: true,
		},
	},
})
