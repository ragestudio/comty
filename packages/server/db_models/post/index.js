export default {
    name: "Post",
    collection: "posts",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            required: true
        },
        message: {
            type: String
        },
        attachments: {
            type: Array,
            default: []
        },
        flags: {
            type: Array,
            default: []
        },
        reply_to: {
            type: String,
            default: null
        },
        updated_at: {
            type: String,
            default: null
        },
        poll_options: {
            type: Array,
            default: null
        }
    }
}