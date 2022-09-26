import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"

import { CreatePost, ToogleLike, GetPostsFeed, GetPostData, DeletePost, ToogleSavePost } from "./methods"

export default class PostsController extends Controller {
    static refName = "PostsController"
    //static useMiddlewares = ["withAuthentication"]

    get = {
        "/feed": {
            middlewares: ["withOptionalAuthentication"],
            fn: Schematized({
                select: ["user_id"]
            }, async (req, res) => {
                let posts = await GetPostsFeed({
                    feedLimit: req.query?.limit,
                    feedTrimIndex: req.query?.trim,
                    from_user_id: req.query?.user_id,
                    for_user_id: req.user?._id.toString(),
                    savedOnly: req.query?.savedOnly,
                })

                return res.json(posts)
            })
        },
        "/post": {
            fn: Schematized({
                select: ["post_id"],
                required: ["post_id"]
            }, async (req, res) => {
                let post = await GetPostData({
                    post_id: req.query?.post_id,
                }).catch((error) => {
                    res.status(404).json({ error: error.message })

                    return null
                })

                if (!post) return

                return res.json(post)
            })
        },
    }

    put = {

    }

    post = {
        "/post": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["message"],
                select: ["message", "additions", "type", "data"],
            }, async (req, res) => {
                const post = await CreatePost({
                    user_id: req.user.id,
                    message: req.selection.message,
                    additions: req.selection.additions,
                    type: req.selection.type,
                    data: req.selection.data,
                })

                return res.json(post)
            })
        },
        "/toogle_like": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id", "to"],
            }, async (req, res) => {
                const post = await ToogleLike({
                    user_id: req.user._id.toString(),
                    post_id: req.selection.post_id,
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
        "/post/:post_id/toogle_like": {
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
        "/post/toogle_save": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                const post = await ToogleSavePost({
                    user_id: req.user._id.toString(),
                    post_id: req.selection.post_id,
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
        "/post/:post_id/save": {
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
        "/post": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                const post = await DeletePost({
                    post_id: req.selection.post_id,
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
            })
        },
    }
}