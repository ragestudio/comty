export default {
	name: "Track",
	collection: "tracks",
	schema: {
		source: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		album: {
			type: String,
		},
		artist: {
			type: String,
		},
		metadata: {
			type: Object,
		},
		explicit: {
			type: Boolean,
			default: false,
		},
		public: {
			type: Boolean,
			default: true,
		},
		publish_date: {
			type: Date,
		},
		cover: {
			type: String,
			default:
				"https://storage.ragestudio.net/comty-static-assets/default_song.png",
		},
		publisher: {
			type: Object,
			required: true,
		},
	},
}
