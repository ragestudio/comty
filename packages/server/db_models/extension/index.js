export default {
    name: "Extension",
    collection: "extensions",
    schema: {
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
        distURL: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        version: {
            type: String,
            required: true
        },
        experimental: {
            type: Boolean,
            default: false
        },
    }
}