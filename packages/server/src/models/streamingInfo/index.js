export default {
    name: "StreamingInfo",
    collection: "streamingInfos",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            default: "Untitled"
        },
        description: {
            type: String,
            default: "No description"
        },
        category: {
            type: String,
            default: "Other"
        },
        thumbnail: {
            type: String
        },
    }
}