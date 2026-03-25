export default {
	key: ["user_id"],
	table_name: "groups_user_orders",
	fields: {
		user_id: "varchar",
		order: {
			type: "list",
			typeDef: "<text>",
		},
	},
}
