import { Controller } from "linebridge/dist/server"
import { Schematized } from "../../lib"
import { Post, User } from "../../models"

export default class PostsController extends Controller {
    static refName = "PostsController"
    //static useMiddlewares = ["withAuthentication"]

    methods = {
        createPost: async (payload) => {
            const { user_id, message, additions } = payload

            const userData = await User.findById(user_id)

            const post = new Post({
                user_id: typeof user_id === "object" ? user_id.toString() : user_id,
                message: String(message).toString(),
                additions: additions ?? [],
                created_at: new Date().getTime(),
            })

            await post.save()

            global.wsInterface.io.emit(`post.new`, {
                ...post.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`post.new.${post.user_id}`, {
                ...post.toObject(),
                user: userData.toObject(),
            })

            return post
        },
        toogleLike: async (payload) => {
            const { post_id, user_id } = payload

            const post = await Post.findById(post_id)

            if (post.likes.includes(user_id)) {
                return this.methods.unlikePost({ post_id, user_id })
            } else {
                return this.methods.likePost({ post_id, user_id })
            }
        },
        likePost: async (payload) => {
            const { user_id, post_id } = payload

            const userData = await User.findById(user_id)
            const postData = await Post.findById(post_id)

            if (postData.likes.includes(user_id)) {
                postData.likes = postData.likes.filter(id => id !== user_id)
                await postData.save()

                return false
            }

            postData.likes.push(user_id)

            await this.savePostData(postData)

            global.wsInterface.io.emit(`post.like`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`post.like.${postData.user_id}`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`post.like.${post_id}`, postData.toObject().likes)

            return postData
        },
        unlikePost: async (payload) => {
            const { user_id, post_id } = payload

            const userData = await User.findById(user_id)
            const postData = await Post.findById(post_id)

            postData.likes = postData.likes.filter(id => id !== user_id)

            await this.savePostData(postData)

            global.wsInterface.io.emit(`post.unlike`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`post.unlike.${postData.user_id}`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`post.unlike.${post_id}`, postData.toObject().likes)

            return postData
        },
        deletePost: async (payload) => {
            const { post_id, user_id } = payload

            if (!user_id) {
                throw new Error("user_id not provided")
            }

            const postData = await Post.findById(post_id)

            if (!postData) {
                throw new Error("Post not found")
            }

            const hasAdmin = await this.methods.hasAdmin({ user_id })

            // check if user is the owner of the post
            if (postData.user_id !== user_id && !hasAdmin) {
                throw new Error("You are not allowed to delete this post")
            }

            await postData.remove()
            global.wsInterface.io.emit(`post.delete`, post_id)
        },
        hasAdmin: async (payload) => {
            const { user_id } = payload

            if (!user_id) {
                return false
            }

            const userData = await User.findById(user_id)

            if (!userData) {
                return false
            }

            return userData.roles.includes("admin")
        }
    }

    savePostData = async (post) => {
        await post.save()

        global.wsInterface.io.emit(`post.dataUpdate`, post.toObject())
        global.wsInterface.io.emit(`post.dataUpdate.${post._id}`, post.toObject())
    }

    get = {
        "/feed": {
            fn: Schematized({
                select: ["user_id"]
            }, async (req, res) => {
                const feedLimit = req.query?.limit ?? 20
                const feedTrimIndex = req.query?.trim ?? 0

                // make sure that sort by date descending
                // trim index is used to get the last n posts
                let posts = await Post.find(req.selection)
                    .sort({ created_at: -1 })
                    .skip(feedTrimIndex)
                    .limit(feedLimit)

                // fetch and add user data to each post
                posts = posts.map(async (post, index) => {
                    const user = await User.findById(post.user_id)

                    if (feedTrimIndex > 0) {
                        index = Number(feedTrimIndex) + Number(index)
                    }

                    return {
                        ...post.toObject(),
                        user: user.toObject(),
                        key: index,
                    }
                })

                posts = await Promise.all(posts)

                return res.json(posts)
            })
        },
        "/post": {
            fn: Schematized({
                select: ["post_id"],
                required: ["post_id"]
            }, async (req, res) => {
                if (typeof req.selection.post_id !== "string") {
                    return res.status(400).json({
                        error: "post_id must be a string"
                    })
                }

                const post = await Post.findById(req.selection.post_id).catch(() => null)

                if (!post) {
                    return res.status(404).json({
                        error: "Post not found"
                    })
                }

                const user = await User.findById(post.user_id)

                return res.json({
                    ...post.toObject(),
                    user: user.toObject(),
                })
            })
        }
    }

    put = {
        "/post": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["message"],
                select: ["message", "additions"],
            }, async (req, res) => {
                const post = await this.methods.createPost({
                    user_id: req.user.id,
                    message: req.selection.message,
                    additions: req.selection.additions,
                })

                return res.json(post)
            })
        },
        "/toogle_like": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                const post = await this.methods.toogleLike({
                    user_id: req.user._id.toString(),
                    post_id: req.selection.post_id,
                }).catch((err) => {
                    return false
                })

                if (!post) {
                    return res.json({
                        error: err.message,
                        success: false
                    })
                }

                return res.json({
                    success: true,
                    post
                })
            })
        },
        "/like": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                const post = await this.methods.likePost({
                    user_id: req.user._id.toString(),
                    post_id: req.selection.post_id,
                }).catch((err) => {
                    return false
                })

                if (!post) {
                    return res.json({
                        success: false,
                    })
                }

                return res.json({
                    success: true,
                })
            })
        },
        "/unlike": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                const post = await this.methods.unlikePost({
                    user_id: req.user._id.toString(),
                    post_id: req.selection.post_id,
                }).catch((err) => {
                    return false
                })

                if (!post) {
                    return res.json({
                        success: false,
                    })
                }

                return res.json({
                    success: true,
                })
            })
        },
    }

    post = {
        "/fix_posts_data": {
            public: false, // This will be functional with next versions of linebridge (Will exclude this endpoint from the server endpoint map)
            middlewares: ["withAuthentication", "onlyAdmin"],
            fn: async (req, res) => {
                const posts = await Post.find()

                for await (let post of posts) {
                    if (Array.isArray(post.additions) && post.additions.length > 0) {
                        post.additions = post.additions.map((addition) => {
                            // fix strings additions
                            if (typeof addition === "string") {
                                addition = {
                                    url: addition,
                                }
                            }

                            // replace insecure http urls with https
                            if (addition.url.startsWith("http://")) {
                                addition.url = addition.url.replace("http://", "https://")
                            }

                            // fix old local path resolve (${host}/upload/id => ${host}/storage/id)
                            const hostnamePath = addition.url.replace(/^https?:\/\//, "")
                            if (hostnamePath.startsWith(`${global.publicHostname}/upload`)) {
                                addition.url = addition.url.replace(`${global.publicHostname}/upload`, `${global.publicHostname}/storage`)
                            }

                            console.log(`Processed addition >`, addition)

                            return addition
                        })
                    }

                    await Post.findByIdAndUpdate(post._id, {
                        additions: post.additions,
                    })
                }

                return res.json({
                    success: true
                })
            }
        },
    }

    delete = {
        "/post": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["post_id"],
                select: ["post_id"],
            }, async (req, res) => {
                await this.methods.deletePost({
                    post_id: req.selection.post_id,
                    user_id: req.user._id.toString(),
                })
                    .then(() => {
                        return res.json({
                            success: true,
                        })
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            message: err.message,
                        })
                    })
            })
        },
    }
}