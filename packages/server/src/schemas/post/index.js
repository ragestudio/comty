export default {
    user_id: { type: String, required: true },
    timestamp: { type: String, required: true },
    created_at: { type: Date, default: Date.now, required: true },
    message: { type: String },
    likes: { type: Array, default: [] },
    attachments: { type: Array, default: [] },
    type: { type: String, default: "text" },
    data: { type: Object, default: {} },
    flags: { type: Array, default: [] },
}