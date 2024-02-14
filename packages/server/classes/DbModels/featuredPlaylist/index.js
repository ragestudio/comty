export default {
    name: "FeaturedPlaylist",
    collection: "featuredPlaylists",
    schema: {
        title: { type: String, required: true },
        description: { type: String },
        cover_url: { type: String },
        enabled: { type: Boolean, default: true },
        genre: { type: String },
        playlist_id: { type: String, required: true },
    }
}