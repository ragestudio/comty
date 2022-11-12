export default {
    user_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now, required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    list: { type: Object, default: [], required: true },
}