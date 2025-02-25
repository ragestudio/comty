export default {
	name: "PasswordRecover",
	collection: "password_recover",
	schema: {
		user_id: { type: String, required: true },

		created_at: { type: Date, required: true },
		expires_at: { type: Date, required: true },

		code: { type: String, required: true, select: false },

		ip_address: { type: String, required: true },
		client: { type: String, required: true },
	},
}
