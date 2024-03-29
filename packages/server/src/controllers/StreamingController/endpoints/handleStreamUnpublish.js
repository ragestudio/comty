import { StreamingProfile } from "@shared-classes/DbModels"

export default {
    method: "POST",
    route: "/stream/unpublish",
    fn: async (req, res) => {
        const { stream } = req.body

        const streamingProfile = await StreamingProfile.findOne({
            stream_key: stream
        })

        if (streamingProfile) {
            global.engine.ws.io.of("/").emit(`streaming.end`, streamingProfile)

            global.engine.ws.io.of("/").emit(`streaming.end.${streamingProfile.user_id}`, streamingProfile)

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