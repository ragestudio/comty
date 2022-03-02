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

            global.wsInterface.io.emit(`new.post`, {
                ...post.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`new.post.${post.user_id}`, {
                ...post.toObject(),
                user: userData.toObject(),
            })

            return post
        },
        likePost: async (payload) => {
            const { user_id, post_id } = payload
            const userData = await User.findById(user_id)
            const postData = await Post.findById(post_id)

            postData.likes.push(user_id)
            await postData.save()

            global.wsInterface.io.emit(`like.post`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })
            global.wsInterface.io.emit(`like.post.${postData.user_id}`, {
                ...postData.toObject(),
                user: userData.toObject(),
            })

            return postData
        }
    }

    get = {
        "/feed": Schematized({
            select: ["user_id"]
        }, async (req, res) => {
            const feedLength = req.query?.feedLength ?? 25
            const feedSkip = req.query?.feedSkip ?? 0

            let leghtOffset = feedLength * feedSkip

            console.log(leghtOffset, feedSkip)

            // fetch posts from later of lenghtOffset with a maximum of feedLength
            // make sort by date descending
            let posts = await Post.find(req.selection)
                .sort({ created_at: -1 })
                .skip(leghtOffset)
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
                user_id: req.user.id,
                post_id: req.selection.post_id,
            })

            return res.json(post)
        }),
    }
}