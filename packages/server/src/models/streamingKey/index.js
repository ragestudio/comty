export default {
    name: "StreamingKey",
    collection: "streamingKeys",
    schema: {
        username: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        key: {
            type: String,
            required: true,
        }
    }
}