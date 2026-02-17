export default {
	name: "Group",
	collection: "groups",
	schema: {
		name: {
			type: String,
			default: "Default room",
		},
		description: {
			type: String,
			default: "Default room description",
		},
		icon: {
			type: String,
		},
		cover: {
			type: String,
		},
		owner_user_id: {
			type: String,
			required: true,
		},
		members: {
			type: [Object],
			required: true,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
}
