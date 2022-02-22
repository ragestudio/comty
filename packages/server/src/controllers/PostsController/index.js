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
    }

    get = {
        "/feed": Schematized({
            select: ["user_id"]
        }, async (req, res) => {
            let posts = await Post.find(req.selection)

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
        })
    }
}