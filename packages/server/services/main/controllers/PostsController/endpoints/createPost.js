import { Schematized } from "@lib"
import { CreatePost } from "../services"

export default {
    method: "POST",
    route: "/new",
    middlewares: ["withAuthentication"],
    fn: Schematized({
        required: ["timestamp"],
        select: ["message", "attachments", "timestamp", "reply_to"],
    }, async (req, res) => {
        const post = await CreatePost({
            user_id: req.user._id.toString(),
            message: req.selection.message,
            timestamp: req.selection.timestamp,
            attachments: req.selection.attachments,
            reply_to: req.selection.reply_to,
        })

        return res.json(post)
    })
}