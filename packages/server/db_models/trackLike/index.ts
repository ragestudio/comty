import { defineModel } from "@db_models"

export default defineModel({
	name: "TrackLike",
	collection: "tracks_likes",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		track_id: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
		},
	},
})
