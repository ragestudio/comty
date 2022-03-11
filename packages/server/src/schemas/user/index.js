export default {
    refreshToken: { type: String, select: false },
    username: { type: String, required: true },
    password: { type: String, required: true, select: false },
    fullName: String,
    avatar: { type: String },
    email: String,
    roles: { type: Array, default: [] },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date },
    badges: { type: Array, default: [] },
}