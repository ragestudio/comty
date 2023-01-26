export default {
    name: "Playlist",
    collection: "playlists",
    schema: {
        user_id: { type: String, required: true },
        created_at: { type: Date, default: Date.now, required: true },
        type: { type: String, default: "track", required: true },
        title: { type: String, required: true },
        description: { type: String },
        thumbnail: { type: String },
        list: { type: Object, default: [], required: true },
    }
}