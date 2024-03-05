export default {
    name: "Config",
    collection: "config",
    schema: {
        key: {
            type: String,
            required: true
        },
        value: {
            // type can be anything
            type: Object,
            required: true
        },
    }
}