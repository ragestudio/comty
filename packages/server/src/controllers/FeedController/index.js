import { Controller } from "linebridge/dist/server"

import getPosts from "./methods/getPosts"

export default class FeedController extends Controller {
    static refName = "FeedController"
    static useRoute = "/feed"

    get = {
        "/posts": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const for_user_id = req.user?._id.toString()

                if (!for_user_id) {
                    return res.status(400).json({
                        error: "Invalid user id"
                    })
                }

                let feed = []

                // fetch posts
                const posts = await getPosts({
                    for_user_id,
                    limit: req.query?.limit,
                    skip: req.query?.trim,
                })

                feed = feed.concat(posts)

                return res.json(feed)
            }
        }
    }
}