import deleteComment from "../methods/deleteComment"

export default {
    method: "DELETE",
    route: "/post/:post_id/:comment_id",
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