export default {
    name: "FeaturedWallpaper",
    collection: "featuredWallpapers",
    schema: {
        date: { type: Date, default: Date.now },
        url: { type: String, required: true },
        author: { type: String },
    }
}