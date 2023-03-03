export default {
    name: "Track",
    collection: "tracks",
    schema: {
        user_id: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
        },  
        thumbnail: {
            type: String,
        },
    }
}