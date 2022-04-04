import { ComplexController } from "linebridge/dist/classes"
import { Schematized } from "../../lib"
import { Post, User } from "../../models"

export default class PostsController extends ComplexController {
    static refName = "PostsController"
    static useMiddlewares = ["withAuthentication"]

    methods = {
        createPost: async (payload) => {
            const { user_id, message } = payload
            const userData = await User.findById(user_id)

            const post = new Post({
                user_id: typeof user_id === "object" ? user_id.toString() : user_id,
                message: String(message).toString(),
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
            await postData.save()

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
            await postData.save()

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

    get = {
        "/feed": Schematized({
            select: ["user_id"]
        }, async (req, res) => {
            const feedLength = req.query?.feedLength ?? 25

            // fetch posts from later of lenghtOffset with a maximum of feedLength
            // make sort by date descending
            let posts = await Post.find(req.selection)
                .sort({ created_at: -1 })
                .limit(feedLength)

            // fetch and add user data to each post
            posts = posts.map(async (post) => {
                const user = await User.findById(post.user_id)

                return {
                    ...post.toObject(),
                    user: user.toObject(),
                }
            })

            posts = await Promise.all(posts)

            return res.json(posts)
        }),
    }

    put = {
        "/post": Schematized({
            required: ["message"],
            select: ["message"],
        }, async (req, res) => {
            const post = await this.methods.createPost({
                user_id: req.user.id,
                message: req.selection.message,
            })

            return res.json(post)
        }),
        "/like": Schematized({
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
                    sucess: false,
                })
            }

            return res.json({
                sucess: true,
            })
        }),
        "/unlike": Schematized({
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
                    sucess: false,
                })
            }

            return res.json({
                sucess: true,
            })
        }),
    }

    delete = {
        "/post": Schematized({
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
        }),
    }
}