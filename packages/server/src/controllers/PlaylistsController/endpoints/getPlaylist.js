import getPlaylist from "../services/getPlaylist"

export default {
    method: "GET",
    route: "/data/:id",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const result = await getPlaylist({
            _id: req.params.id
        }).catch((err) => {
            res.status(500).json({
                error: err.message
            })

            return null
        })

        if (result) {
            return res.json(result)
        }
    }
}