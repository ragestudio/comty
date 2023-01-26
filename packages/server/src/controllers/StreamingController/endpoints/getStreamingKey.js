import { StreamingKey } from "@models"
import generateStreamingKey from "../services/generateStreamingKey"

export default {
    method: "GET",
    route: "/streaming/key",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let streamingKey = await StreamingKey.findOne({
            user_id: req.user._id.toString()
        })

        if (!streamingKey) {
            const newKey = await generateStreamingKey(req.user._id.toString()).catch(err => {
                res.status(500).json({
                    error: `Cannot generate a new key: ${err.message}`,
                })

                return false
            })

            if (!newKey) {
                return false
            }

            return res.json(newKey)
        } else {
            return res.json(streamingKey)
        }
    }
}