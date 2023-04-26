import { ServerLimit } from "@models"

export default {
    method: "GET",
    route: "/global_server_limits/:limitkey",
    fn: async (req, res) => {
        const { limitkey } = req.params

        const serverLimit = await ServerLimit.findOne({
            key: limitkey,
            active: true,
        })
            .catch(err => {
                return res.status(500).json({
                    error: err.message
                })
            })

        if (!serverLimit) {
            return res.status(404).json({
                error: "Server limit not found or inactive"
            })
        }

        return res.json(serverLimit)
    }
}