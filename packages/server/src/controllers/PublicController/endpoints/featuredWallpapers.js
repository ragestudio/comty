import { FeaturedWallpaper } from "@shared-classes/DbModels"

export default {
    method: "GET",
    route: "/featured_wallpapers",
    fn: async (req, res) => {
        const { all } = req.query

        const query = {
            active: true
        }

        if (all) {
            delete query.active
        }

        const featuredWallpapers = await FeaturedWallpaper.find(query)
            .sort({ date: -1 })
            .limit(all ? undefined : 10)
            .catch(err => {
                return res.status(500).json({
                    error: err.message
                }).end()
            })

        return res.json(featuredWallpapers)
    }
}