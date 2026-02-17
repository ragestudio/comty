export default {
	key: [["group_id"], "key"],
	table_name: "groups_invite_keys",
	fields: {
		group_id: "varchar",
		key: "varchar",
		issuer_user_id: "varchar",
		created_at: "timestamp",
		expires_at: "timestamp",
		max_usage: "int",
		usages: {
			type: "int",
			default: 0,
		},
	},
}
