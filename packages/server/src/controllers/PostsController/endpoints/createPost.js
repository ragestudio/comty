import { Schematized } from "@lib"
import { CreatePost } from "../services"

export default {
    method: "POST",
    route: "/new",
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
}