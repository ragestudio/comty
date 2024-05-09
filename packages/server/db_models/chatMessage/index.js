export default {
    name: "ChatMessage",
    collection: "chats_messages",
    schema: {
        type: { type: String, required: true },
        from_user_id: { type: String, required: true },
        to_user_id: { type: String, required: true },
        content: { type: String, required: true },
        created_at: { type: Date, required: true },
    }
}