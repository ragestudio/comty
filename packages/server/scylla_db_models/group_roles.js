export default {
	key: [["group_id"], "role_key"],
	table_name: "group_roles",
	fields: {
		group_id: "varchar",
		role_key: "varchar",
		permissions: {
			type: "frozen",
			typeDef: "<list <map <varchar, boolean>>>",
		},
	},
}
