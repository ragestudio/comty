export default {
    name: "FeaturedWallpaper",
    collection: "featuredWallpapers",
    schema: {
        active: { type: Boolean, default: true },
        date: { type: Date, default: Date.now },
        url: { type: String, required: true },
        author: { type: String },
    }
}