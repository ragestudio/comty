export default {
	key: [["user_id"], "room_id"],
	table_name: "direct_messages_activity",
	fields: {
		user_id: "varchar",
		room_id: "varchar",
		to_user_id: "varchar",
		last_message_at: "timestamp",
		direction: "text",
		short_message: "text",
	},
}
