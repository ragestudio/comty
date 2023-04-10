import { StreamingProfile } from "@models"

export default {
    method: "POST",
    route: "/stream/unpublish",
    fn: async (req, res) => {
        const { stream } = req.body

        const streamingProfile = await StreamingProfile.findOne({
            stream_key: stream
        })

        if (streamingProfile) {
            global.websocket_instance.io.emit(`streaming.end`, streamingProfile)

            global.websocket_instance.io.emit(`streaming.end.${streamingProfile.user_id}`, streamingProfile)

            return res.json({
                code: 0,
                status: "ok"
            })
        }

        return res.json({
            code: 0,
            status: "ok, but no streaming profile found"
        })
    }
}