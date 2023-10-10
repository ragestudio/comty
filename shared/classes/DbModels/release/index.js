export default {
    name: "Release",
    collection: "releases",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
        },
        list: {
            type: Object,
            default: [],
            required: true
        },
        cover: {
            type: String,
            default: "https://storage.ragestudio.net/comty-static-assets/default_song.png"
        },
        created_at: {
            type: Date,
            required: true
        },
        publisher: {
            type: Object,
        },
        public: {
            type: Boolean,
            default: true,
        },
    }
}