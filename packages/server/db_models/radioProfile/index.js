export default {
	name: "RadioProfile",
	collection: "radio_profiles",
	schema: {
		user_id: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
			required: true,
		},
		token: {
			type: String,
			required: true,
			select: false,
		},
		background: {
			type: String,
		},
	},
}
