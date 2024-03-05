export default {
    name: "Role",
    collection: "roles",
    schema: {
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        apply: {
            type: Object,
        }
    }
}