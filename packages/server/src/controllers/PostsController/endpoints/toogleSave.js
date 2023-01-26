import { ToogleSavePost } from "../methods"

export default {
    method: "POST",
    route: "/:post_id/toogle_save",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const post = await ToogleSavePost({
            user_id: req.user._id.toString(),
            post_id: req.params.post_id,
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