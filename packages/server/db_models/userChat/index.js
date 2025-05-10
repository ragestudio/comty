export default {
	name: "UserChat",
	collection: "user_chats",
	schema: {
		user_1: {
			type: Object,
			required: true,
		},
		user_2: {
			type: Object,
			required: true,
		},
		started_at: {
			type: Number,
			default: () => new Date().getTime(),
		},
		updated_at: {
			type: Number,
			default: () => new Date().getTime(),
		},
		// ... set other things like themes, or more info
	},
}
