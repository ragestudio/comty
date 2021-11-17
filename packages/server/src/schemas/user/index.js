export default {
    username: { type: String, required: true },
    password: { type: String, required: true, select: false },
    fullName: String,
    avatar: { type: String },
    email: String,
    roles: [],
    legal_id: Object,
    phone: Number,
}