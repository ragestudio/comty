export default {
	name: "GroupChannel",
	collection: "group_channels",
	schema: {
		name: {
			type: String,
			default: "Untitled channel",
		},
		description: {
			type: String,
			default: "No description",
		},
		encoding_params: {
			type: Object,
			default: {
				maxBitrate: 98000,
			},
		},
		kind: {
			type: String,
			required: true,
		},
		group_id: {
			type: String,
			required: true,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
}
