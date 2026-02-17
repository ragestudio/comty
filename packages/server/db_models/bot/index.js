export default {
	name: "Bot",
	collection: "bots",
	schema: {
		user_id: { type: String, required: false },
		owner_user_id: { type: String, required: true },
		token: { type: String, required: true, select: false },
		created_at: { type: Date, required: true },
	},
}
