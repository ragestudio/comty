import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

import { FeaturedWallpaper } from "../../models"

export default class PublicController extends Controller {
    static refName = "PublicController"

    get = {
        "/featured_wallpapers": {
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
    }

    post = {
        "/only_managers_test": {
            middlewares: ["withAuthentication", "permissions"],
            fn: (req, res) => {
                return res.json({
                    message: "Congrats!, Only managers can access this route (or you are an admin)",
                    assertedPermissions: req.assertedPermissions
                })
            },
        },
        "/new_featured_wallpaper": {
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
    }
}