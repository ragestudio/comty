import { FeaturedWallpaper } from "../../../models"

export default {
    method: "GET",
    route: "/featured_wallpapers",
    fn: async (req, res) => {
        const featuredWallpapers = await FeaturedWallpaper.find({})
            .sort({ date: -1 })
            .limit(10)
            .catch(err => {
                return res.status(500).json({
                    error: err.message
                }).end()
            })

        return res.json(featuredWallpapers)
    }
}