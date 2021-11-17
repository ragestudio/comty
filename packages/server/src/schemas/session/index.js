export default {
    allowRegenerate: { type: Boolean, default: false },
    uuid: { type: String, required: true },
    token: { type: String, required: true },
    user_id: { type: String, required: true },
    date: { type: Number, default: 0 },
    location: { type: String, default: "Unknown" },
    geo: { type: String, default: "Unknown" },
}