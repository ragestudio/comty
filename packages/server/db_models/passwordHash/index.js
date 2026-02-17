export default {
	name: "PasswordHash",
	collection: "password_hashes",
	schema: {
		user_id: { type: String, required: true },
		hash: { type: String, required: true },
	},
}
