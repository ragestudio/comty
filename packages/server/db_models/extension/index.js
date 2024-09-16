export default {
    name: "Extension",
    collection: "extensions",
    schema: {
        version: {
            type: String,
            required: true
        },
        title: {
            type: String,
            default: "Untitled"
        },
        description: {
            type: String,
            default: "Description"
        },
        image: {
            type: String,
            default: "https://placehold.co/400x400"
        },
        created_at: {
            type: Date,
            required: true,
        },
        experimental: {
            type: Boolean,
            default: false
        },
    }
}