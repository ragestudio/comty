import { Controller } from "linebridge/dist/server"
import { User, Post, Comment } from "../../models"
import { Schematized } from "../../lib"

import getComments from "./methods/getComments"
import newComment from "./methods/newComment"
import deleteComment from "./methods/deleteComment"

export default class CommentsController extends Controller {
    static refName = "CommentsController"

    get = {
        "/post/:post_id/comments": {
            fn: async (req, res) => {
                const { post_id } = req.params

                const comments = await getComments({ parent_id: post_id }).catch((err) => {
                    res.status(400).json({
                        error: err.message,
                    })

                    return false
                })

                if (!comments) return

                return res.json(comments)
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

                try {
                    const comment = newComment({
                        user_id: req.user._id.toString(),
                        parent_id: post_id,
                        message: message,
                    })

                    return res.json(comment)
                } catch (error) {
                    return res.status(400).json({
                        error: error.message,
                    })
                }
            })
        }
    }

    delete = {
        "/post/:post_id/comment/:comment_id": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const result = await deleteComment({
                    comment_id: req.params.comment_id,
                    issuer_id: req.user._id.toString(),
                }).catch((err) => {
                    res.status(500).json({ message: err.message })

                    return false
                })

                if (result) {
                    return res.json(result)
                }
            }
        }
    }
}