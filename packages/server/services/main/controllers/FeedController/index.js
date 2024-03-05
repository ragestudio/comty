import { Controller } from "linebridge/dist/server"

import pmap from "p-map"

import getPosts from "./services/getPosts"

import getGlobalReleases from "./services/getGlobalReleases"
import getReleasesFromFollowing from "./services/getReleasesFromFollowing"
import getPlaylistsFromFollowing from "./services/getPlaylistsFromFollowing"

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

                    // add type to posts and playlists
                    posts = posts.map((data) => {
                        data.type = "post"

                        return data
                    })

                    let feed = [
                        ...posts,
                    ]

                    // sort feed
                    feed.sort((a, b) => {
                        return new Date(b.created_at) - new Date(a.created_at)
                    })

                    return res.json(feed)
                }
            },
            "/music/global": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const for_user_id = req.user?._id.toString()

                    if (!for_user_id) {
                        return res.status(400).json({
                            error: "Invalid user id"
                        })
                    }

                    // fetch playlists from global
                    const result = await getGlobalReleases({
                        for_user_id,
                        limit: req.query?.limit,
                        skip: req.query?.trim,
                    })

                    return res.json(result)
                }
            },
            "/music": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const for_user_id = req.user?._id.toString()

                    if (!for_user_id) {
                        return res.status(400).json({
                            error: "Invalid user id"
                        })
                    }

                    const searchers = [
                        getGlobalReleases,
                        //getReleasesFromFollowing,
                        //getPlaylistsFromFollowing,
                    ]

                    let result = await pmap(
                        searchers,
                        async (fn, index) => {
                            const data = await fn({
                                for_user_id,
                                limit: req.query?.limit,
                                skip: req.query?.trim,
                            })

                            return data
                        }, {
                        concurrency: 3,
                    },)

                    result = result.reduce((acc, cur) => {
                        return [...acc, ...cur]
                    }, [])

                    return res.json(result)
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
        }
    }
}