export default {
	key: ["group_id"],
	table_name: "group_channels_order",
	fields: {
		group_id: "varchar",
		order: {
			type: "list",
			typeDef: "<text>",
		},
	},
}
