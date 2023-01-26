import { Schematized } from "@lib"
import { ToogleLike } from "../methods"

export default {
    method: "GET",
    route: "/:post_id/toogle_like",
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