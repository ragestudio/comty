export default {
	key: [["group_id"], "created_at"],
	table_name: "group_memberships_ref",
	fields: {
		group_id: "varchar",
		user_id: "varchar",
		membership_id: "varchar",
		created_at: "timestamp",
	},
}
