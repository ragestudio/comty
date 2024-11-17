export default {
    name: "Extension",
    collection: "extensions",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        assetsUrl: {
            type: String,
            required: true
        },
        srcUrl: {
            type: String,
            required: true
        },
        registryId: {
            type: String,
            required: true
        },
        packageUrl: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        name: {
            type: String,
            default: "untitled"
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
    }
}