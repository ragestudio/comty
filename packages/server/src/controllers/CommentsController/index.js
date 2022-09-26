import { Controller } from "linebridge/dist/server"
import { User, Post, Comment } from "../../models"
import { Schematized } from "../../lib"

import getComments from "./methods/getComments"

export default class CommentsController extends Controller {
    static refName = "CommentsController"

    get = {
        "/comments": {
            fn: Schematized({
                required: ["targetId"],
                select: ["targetId"],
            }, async (req, res) => {

            })
        },
        "/post/:post_id/comments": {
            fn: async (req, res) => {
                const { post_id } = req.params

                let comments = await Comment.find({ parent_id: post_id }).catch(err => {
                    res.status(500).json({ message: err.message })

                    return false
                })

                if (comments) {
                    // fullfill comments with user data
                    comments = await Promise.all(comments.map(async comment => {
                        const user = await User.findById(comment.user_id)

                        return {
                            ...comment.toObject(),
                            user: user.toObject(),
                        }
                    }))

                    return res.json(comments)
                }
            }
        }
    }

    post = {
        "/post/:post_id/comment": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["message"],
                select: ["message"],
            }, async (req, res) => {
                const { post_id } = req.params
                const { message } = req.selection

                const comment = new Comment({
                    user_id: req.user._id.toString(),
                    parent_id: post_id,
                    message: message,
                })

                await comment.save()

                if (comment) {
                    return res.json(comment)
                }
            })
        }
    }

    put = {

    }

    delete = {

    }
}