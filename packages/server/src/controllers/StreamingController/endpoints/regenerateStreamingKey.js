import { StreamingKey } from "@models"
import generateStreamingKey from "../services/generateStreamingKey"

export default {
    method: "POST",
    route: "/streaming/key/regenerate",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        // check if the user already has a key
        let streamingKey = await StreamingKey.findOne({
            user_id: req.user._id.toString()
        })

        // if exists, delete it

        if (streamingKey) {
            await streamingKey.remove()
        }

        // generate a new key
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
    }
}