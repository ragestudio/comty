export default {
    name: "MFASession",
    collection: "mfa_sessions",
    schema: {
        type: { type: String, required: true },
        user_id: { type: String, required: true },

        code: { type: String, required: true },

        created_at: { type: Date, required: true },
        expires_at: { type: Date, required: true },
    }
}