export default {
	name: "UserDHKeyPair",
	collection: "user_dh_key_pairs",
	schema: {
		user_id: {
			type: String,
			required: true,
			unique: true,
		},
		str: {
			type: String,
			required: true,
		},
	},
}
