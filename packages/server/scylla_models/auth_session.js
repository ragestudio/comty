export default {
	key: [["_id"], "user_id"],
	table_name: "auth_sessions",
	fields: {
		_id: "varchar",
		token: "varchar",
		user_id: "varchar",
		username: "varchar",
		sign_location: "varchar",
		ip_address: "varchar",
		client: "varchar",
		created_at: "timestamp",
	},
}
