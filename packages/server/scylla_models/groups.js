export default {
	key: ["_id"],
	table_name: "groups",
	fields: {
		__v: "int",
		_id: "varchar",
		name: "varchar",
		description: "varchar",
		icon: "varchar",
		cover: "varchar",
		reachability: {
			type: "varchar",
			default: "private",
		},
		owner_user_id: "varchar",
		created_at: "timestamp",
	},
	options: {
		defaults: {
			__v: 0,
		},
	},
}
