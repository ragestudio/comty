export default {
	name: "GroupSoundpadItem",
	collection: "group_soundpad_items",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		group_id: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
		name: {
			type: String,
		},
		src: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
		},
	},
}
