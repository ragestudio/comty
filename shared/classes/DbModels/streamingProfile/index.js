export default {
    name: "StreamingProfile",
    collection: "streamingProfiles",
    schema: {
        user_id: {
            type: String,
            required: true,
        },
        profile_name: {
            type: String,
            required: true,
        },
        stream_key: {
            type: String,
            required: true,
            select: false,
        },
        info: {
            type: Object,
            default: {
                title: "Untitled",
                description: "No description",
                category: "other",
                thumbnail: null,
            }
        },
        options: {
            type: Object,
            default: {
                private: false,
                chatEnabled: true,
                drvEnabled: false,
            }
        }
    }
}