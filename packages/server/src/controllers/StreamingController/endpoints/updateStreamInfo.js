import handleStreamInfoUpdate from "../services/handleStreamInfoUpdate"

export default {
    method: "POST",
    route: "/stream/info",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { title, description, category, thumbnail } = req.body

        const info = await handleStreamInfoUpdate({
            user_id: req.user._id.toString(),
            title,
            description,
            category,
            thumbnail
        }).catch((err) => {
            console.error(err)

            res.status(500).json({
                error: `Cannot update info: ${err.message}`,
            })

            return null
        })

        if (info) {
            return res.json(info)
        }
    }
}