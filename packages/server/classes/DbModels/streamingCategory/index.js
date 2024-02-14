export default {
    name: "StreamingCategory",
    collection: "streamingCategories",
    schema: {
        key: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
    }
}