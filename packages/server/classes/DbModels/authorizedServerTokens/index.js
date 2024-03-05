export default {
    name: "authorizedServerTokens",
    collection: "authorizedServerTokens",
    schema: {
        client_id: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
        access: {
            type: Array,
            default: [],
        },
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
}