import { Controller } from "linebridge/dist/server"

import getPosts from "./services/getPosts"
import getPlaylists from "./services/getPlaylists"

export default class FeedController extends Controller {
    static refName = "FeedController"
    static useRoute = "/feed"

    httpEndpoints = {
        get: {
            "/timeline": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const for_user_id = req.user?._id.toString()

                    if (!for_user_id) {
                        return res.status(400).json({
                            error: "Invalid user id"
                        })
                    }

                    // fetch posts
                    let posts = await getPosts({
                        for_user_id,
                        limit: req.query?.limit,
                        skip: req.query?.trim,
                    })

                    // fetch playlists
                    let playlists = await getPlaylists({
                        for_user_id,
                        limit: req.query?.limit,
                        skip: req.query?.trim,
                    })


                    // add type to posts and playlists
                    posts = posts.map((data) => {
                        data.type = "post"

                        return data
                    })

                    playlists = playlists.map((data) => {
                        data.type = "playlist"

                        return data
                    })

                    let feed = [
                        ...posts,
                        ...playlists,
                    ]

                    // sort feed
                    feed.sort((a, b) => {
                        return new Date(b.created_at) - new Date(a.created_at)
                    })

                    return res.json(feed)
                }
            },
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
            },
            "/playlists": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const for_user_id = req.user?._id.toString()

                    if (!for_user_id) {
                        return res.status(400).json({
                            error: "Invalid user id"
                        })
                    }

                    let feed = []

                    // fetch playlists
                    const playlists = await getPlaylists({
                        for_user_id,
                        limit: req.query?.limit,
                        skip: req.query?.trim,
                    })

                    feed = feed.concat(playlists)

                    return res.json(feed)
                }
            }
        }
    }
}