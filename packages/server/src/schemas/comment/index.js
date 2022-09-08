export default {
    user_id: { type: String, required: true },
    parent_id: { type: String, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    liked: { type: Array, default: [] },
}