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
        album: {
            type: String,
        },
        artist: {
            type: String,
        },
        source: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
        },
        explicit: {
            type: Boolean,
            default: false,
        },
        public: {
            type: Boolean,
            default: true,
        },
        thumbnail: {
            type: String,
            default: "https://storage.ragestudio.net/comty-static-assets/default_song.png"
        },
    }
}