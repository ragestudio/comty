export default {
	key: [["group_id"], "_id"],
	table_name: "group_channels",
	fields: {
		_id: "varchar",
		group_id: "varchar",
		kind: "varchar",
		name: "varchar",
		description: "varchar",
		params: {
			type: "map",
			typeDef: "<varchar, varchar>",
		},
		created_at: "timestamp",
	},
}
