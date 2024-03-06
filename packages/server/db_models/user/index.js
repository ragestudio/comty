export default {
    name: "User",
    collection: "accounts",
    schema: {
        username: { type: String, required: true },
        password: { type: String, required: true, select: false },
        email: { type: String, required: true },
        description: { type: String, default: null },
        public_name: { type: String, default: null },
        fullName: { type: String, default: null },
        cover: { type: String, default: null },
        avatar: { type: String, default: null },
        roles: { type: Array, default: [] },
        verified: { type: Boolean, default: false },
        birthday: { type: Date, default: null },
        badges: { type: Array, default: [] },
        links: { type: Array, default: [] },
        createdAt: { type: String },
        created_at: { type: String },
    }
}