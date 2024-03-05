import { DeletePost } from "../services"

export default {
    method: "DELETE",
    route: "/:post_id",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const post = await DeletePost({
            post_id: req.params.post_id,
            by_user_id: req.user._id.toString(),
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
    }
}