export default {
    name: "Post",
    collection: "posts",
    schema: {
        user_id: { type: String, required: true },
        timestamp: { type: String, required: true },
        created_at: { type: Date, default: Date.now, required: true },
        message: { type: String },
        attachments: { type: Array, default: [] },
        flags: { type: Array, default: [] },
    }
}