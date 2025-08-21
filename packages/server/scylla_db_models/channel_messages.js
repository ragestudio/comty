export default {
	key: [["channel_id"], "_id"],
	clustering_order: { _id: "asc" },
	table_name: "channel_messages",
	fields: {
		_id: "varchar",
		channel_id: "varchar",
		user_id: "varchar",
		message: "varchar",
		attachments: {
			type: "frozen",
			typeDef: "<list <map <varchar, varchar>>>",
		},
		created_at: "timestamp",
	},
}
