export default {
    session_uuid: { type: String, required: true },
    token: { type: String, required: true },
    username: { type: String, required: true },
    user_id: { type: String, required: true },
    date: { type: Number, default: 0 },
    location: { type: String, default: "Unknown" },
}