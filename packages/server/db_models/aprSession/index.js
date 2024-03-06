export default {
    name: "APRSession",
    collection: "apr_sessions",
    schema: {
        user_id: { type: String, required: true },

        created_at: { type: Date, required: true },
        expires_at: { type: Date, required: true },

        code: { type: String, required: true },

        ip_address: { type: String, required: true },
        client: { type: String, required: true },

        status: { type: String, required: true },
    }
}