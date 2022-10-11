export default {
    user_id: { type: String, required: true },
    created_at: { type: String, required: true },
    message: { type: String, required: true },
    likes: { type: Array, default: [] },
    additions: { type: Array, default: [] },
    type: { type: String, default: "text" },
    data: { type: Object, default: {} },
}