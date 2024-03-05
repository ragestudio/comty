export default {
    name: "Badge",
    collection: "badges",
    schema: {
        name: { type: String, required: true },
        label: { type: String },
        description: { type: String },
        icon: { type: String },
        color: { type: String },
    }
}