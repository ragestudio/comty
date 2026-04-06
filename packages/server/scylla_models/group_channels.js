export default {
	key: [["group_id"], "_id"],
	table_name: "group_channels",
	fields: {
		__v: "bigint",
		_id: "varchar",
		group_id: "varchar",
		kind: "varchar",
		name: "varchar",
		description: "varchar",
		explicit: "boolean",
		params: {
			type: "map",
			typeDef: "<varchar, varchar>",
		},
		created_at: "timestamp",
	},
	options: {
		defaults: {
			__v: 0,
		},
	},
}
