import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

import { CreatePost, ToogleLike, GetPostData, DeletePost, ToogleSavePost } from "./methods"

export default class PostsController extends Controller {
    static refName = "PostsController"
    static useRoute = "/posts"

    get = {
        "/explore": {
            middlewares: ["withOptionalAuthentication"],
            fn: Schematized({
                select: ["user_id"]
            }, async (req, res) => {
                let posts = await GetPostData({
                    limit: req.query?.limit,
                    skip: req.query?.trim,
                    from_user_id: req.query?.user_id,
                    for_user_id: req.user?._id.toString(),
                })

                return res.json(posts)
            })
        },
        "/saved": {
            middlewares: ["withOptionalAuthentication"],
            fn: Schematized({
                select: ["user_id"]
            }, async (req, res) => {
                let posts = await GetPostData({
                    limit: req.query?.limit,
                    skip: req.query?.trim,
                    for_user_id: req.user?._id.toString(),
                    savedOnly: true,
                })

                return res.json(posts)
            })
        },
        "/user/:user_id": {
            middlewares: ["withOptionalAuthentication"],
            fn: async (req, res) => {
                let posts = await GetPostData({
                    limit: req.query?.limit,
                    skip: req.query?.trim,
                    for_user_id: req.user?._id.toString(),
                    from_user_id: req.params.user_id,
                })

                return res.json(posts)
            }
        },
        "/:post_id": {
            middlewares: ["withOptionalAuthentication"],
            fn: async (req, res) => {
                let post = await GetPostData({
                    post_id: req.params.post_id,
                    for_user_id: req.user?._id.toString(),
                }).catch((error) => {
                    res.status(404).json({ error: error.message })

                    return null
                })

                if (!post) return

                return res.json(post)
            }
        },
    }

    put = {
        "/:post_id": {
            middlewares: ["withAuthentication"],
            fn: (req, res) => {
                // TODO: Implement Post update
                return res.status(501).json({ error: "Not implemented" })
            }
        }
    }

    post = {
        "/new": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["timestamp"],
                select: ["message", "attachments", "type", "data", "timestamp"],
            }, async (req, res) => {
                const post = await CreatePost({
                    user_id: req.user.id,
                    message: req.selection.message,
                    timestamp: req.selection.timestamp,
                    attachments: req.selection.attachments,
                    type: req.selection.type,
                    data: req.selection.data,
                })

                return res.json(post)
            })
        },
        "/:post_id/toogle_like": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                select: ["to"],
            }, async (req, res) => {
                const post = await ToogleLike({
                    user_id: req.user._id.toString(),
                    post_id: req.params.post_id,
                    to: req.selection.to,
                }).catch((err) => {
                    res.status(400).json({
                        error: err.message
                    })
                    return false
                })

                if (!post) return

                return res.json({
                    success: true,
                    post
                })
            })
        },
        "/:post_id/toogle_save": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const post = await ToogleSavePost({
                    user_id: req.user._id.toString(),
                    post_id: req.params.post_id,
                }).catch((err) => {
                    res.status(400).json({
                        error: err.message
                    })
                    return false
                })

                if (!post) return

                return res.json({
                    success: true,
                    post
                })
            }
        }
    }

    delete = {
        "/:post_id": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const post = await DeletePost({
                    post_id: req.params.post_id,
                    by_user_id: req.user._id.toString(),
                }).catch((err) => {
                    res.status(400).json({
                        error: err.message
                    })

                    return false
                })

                if (!post) return

                return res.json({
                    success: true,
                    post
                })
            }
        },
    }
}