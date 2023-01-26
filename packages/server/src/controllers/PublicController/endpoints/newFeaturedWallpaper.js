import { Schematized } from "@lib"
import { FeaturedWallpaper } from "@models"

export default {
    method: "POST",
    route: "/featured_wallpaper",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: Schematized({
        select: ["url", "date", "author"],
        required: ["url"],
    }, async (req, res) => {
        const newFeaturedWallpaper = new FeaturedWallpaper(req.selection)

        const result = await newFeaturedWallpaper.save().catch((err) => {
            res.status(400).json({ message: err.message })
            return null
        })

        if (result) {
            return res.json(newFeaturedWallpaper)
        }
    })
}