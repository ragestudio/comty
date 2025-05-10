export default {
	name: "ChatKey",
	collection: "chat_keys",
	schema: {
		user_id_1: {
			type: String,
			required: true,
		},
		user_id_2: {
			type: String,
			required: true,
		},
		encrypted_key_1: {
			type: String,
			required: true,
		},
		encrypted_key_2: {
			type: String,
			default: null,
		},
		created_at: {
			type: Number,
			default: () => new Date().getTime(),
		},
		updated_at: {
			type: Number,
			default: () => new Date().getTime(),
		},
	},
	extend: {
		async findByUsers(user1, user2) {
			return await this.findOne({
				$or: [
					{ user_id_1: user1, user_id_2: user2 },
					{ user_id_1: user2, user_id_2: user1 },
				],
			})
		},
	},
}
