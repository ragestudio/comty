export default {
	key: [["message_id"], "_id"],
	table_name: "channel_messages_ack",
	fields: {
		_id: "varchar",
		message_id: "varchar",
		user_id: "varchar",
		created_at: "timestamp",
	},
}
