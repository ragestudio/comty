import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

import publishPlaylist from "./methods/publishPlaylist"

export default class PlaylistsController extends Controller {
    //static useMiddlewares = ["withAuthentication"]

    get = {
        "/playlist/:id": async (req, res) => {

        }
    }

    post = {
        "/playlist/publish": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["title", "list"],
                select: ["title", "description", "thumbnail", "list"],
            },async (req, res) => {
                if (typeof req.body.list === "undefined") {
                    return res.status(400).json({
                        error: "list is required"
                    })
                }

                // parse
                req.selection.list = JSON.parse(req.selection.list)

                const result = await publishPlaylist({
                    user_id: req.user._id.toString(),
                    ...req.selection
                }).catch((err) => {
                    res.status(500).json({
                        error: err.message
                    })

                    return null
                })

                if (result) {
                    return res.json(result)
                }
            })
            
        }
    }
}