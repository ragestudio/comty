export default {
    name: "Config",
    collection: "config",
    schema: {
        key: { type: String, required: true },
        value: { type: Object, required: true },
    }
}