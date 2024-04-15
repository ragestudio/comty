export default {
    name: "TosViolations",
    collection: "tos_violations",
    schema: {
        user_id: {
            type: "string",
            required: true,
        },
        reason: {
            type: "string",
            required: true,
        },
        expire_at: {
            type: "date",
        }
    }
}