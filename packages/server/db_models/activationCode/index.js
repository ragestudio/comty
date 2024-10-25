export default {
    name: "ActivationCode",
    collection: "activation_codes",
    schema: {
        event: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
        }
    }
}