export default {
    name: "User",
    collection: "accounts",
    schema: {
        username: { type: String, required: true },
        password: { type: String, required: true, select: false },
        cover: { type: String },
        description: { type: String, },
        fullName: String,
        avatar: { type: String },
        email: String,
        roles: { type: Array, default: [] },
        verified: { type: Boolean, default: false },
        birthday: { type: Date },
        createdAt: { type: String },
        badges: { type: Array, default: [] },
        early_supporter: { type: Boolean, default: false },
    }
}