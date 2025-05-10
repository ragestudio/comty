export default {
	name: "MusicLibraryItem",
	collection: "music_library_items",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		item_id: {
			type: String,
			required: true,
		},
		kind: {
			type: String,
			required: true,
			enum: ["tracks", "playlists", "releases"],
		},
		created_at: {
			type: Date,
			required: true,
		},
	},
}
