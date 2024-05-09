export default {
    name: "RecentChat",
    collection: "recent_chats",
    schema: {
        type: { type: String, required: true },
        user_id: { type: String, required: true },
        chat_id: { type: String, required: true },
    }
}