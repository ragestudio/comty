import getComments from "../services/getComments"

export default {
    method: "GET",
    route: "/post/:post_id",
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