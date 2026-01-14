export default {
	key: [["user_id"], "group_id", "_id"],
	table_name: "group_memberships",
	fields: {
		_id: "varchar",
		group_id: "varchar",
		user_id: "varchar",
		roles: {
			type: "frozen",
			typeDef: "<list <varchar>>",
		},
		created_at: "timestamp",
	},
}
