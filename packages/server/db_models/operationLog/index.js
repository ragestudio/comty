export default {
    name: "OperationLog",
    collection: "operation_logs",
    schema: {
        type: { type: String, required: true },
        user_id: { type: String },
        comments: { type: Array, default: [] },

        date: { type: Date, required: true },
        ip_address: { type: String },
        client: { type: String },
    }
}