export default {
    user_id: { type: String, required: true },
    created_at: { type: Number, required: true },
    message: { type: String, required: true },
    likes: { type: Array, default: [] },
    comments: { type: Array, default: [] },
}