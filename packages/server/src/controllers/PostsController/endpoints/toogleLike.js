import { Schematized } from "@lib"
import { ToogleLike } from "../services"

export default {
    method: "POST",
    route: "/:post_id/toggle_like",
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
}