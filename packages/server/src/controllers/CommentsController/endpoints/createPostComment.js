import { Schematized } from "@lib"
import newComment from "../services/newComment"

export default {
    method: "POST",
    route: "/post/:post_id",
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