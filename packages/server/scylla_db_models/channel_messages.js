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
		flags: {
			type: "frozen",
			typeDef: "<list <varchar>>",
		},
		reply_to_id: "varchar",
		updated_at: "timestamp",
		created_at: "timestamp",
	},
}
