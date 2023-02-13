import { GetPostData } from "../services"

export default {
    method: "GET",
    route: "/post/:post_id",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        let post = await GetPostData({
            post_id: req.params.post_id,
            for_user_id: req.user?._id.toString(),
        }).catch((error) => {
            res.status(404).json({ error: error.message })

            return null
        })

        if (!post) return

        return res.json(post)
    }
}