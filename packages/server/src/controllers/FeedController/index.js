import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

import getPosts from "./methods/getPosts"

export default class FeedController extends Controller {
    static refName = "FeedController"

    get = {
        "/feed": {
            middlewares: ["withOptionalAuthentication"],
            fn: Schematized({
                select: ["user_id"]
            }, async (req, res) => {
                const for_user_id = req.user?._id.toString()

                let feed = []

                // fetch posts
                const posts = await getPosts({
                    for_user_id,
                    limit: req.query?.limit,
                    skip: req.query?.trim,
                })

                feed = feed.concat(posts)

                return res.json(feed)
            })
        }
    }
}