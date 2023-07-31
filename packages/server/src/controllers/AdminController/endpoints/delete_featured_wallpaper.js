import { FeaturedWallpaper } from "@shared-classes/DbModels"

export default {
    method: "DELETE",
    route: "/featured_wallpaper/:id",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req, res) => {
        const id = req.params.id

        const wallpaper = await FeaturedWallpaper.findById(id)

        if (!wallpaper) {
            return res.status(404).json({
                error: "Cannot find wallpaper"
            })
        }

        await FeaturedWallpaper.deleteOne({
            _id: id
        })

        return res.json({
            done: true
        })
    }
}