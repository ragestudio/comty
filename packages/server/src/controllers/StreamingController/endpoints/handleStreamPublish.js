import { StreamingProfile, User } from "@models"

export default {
    method: "POST",
    route: "/stream/publish",
    fn: async (req, res) => {
        const { stream, app } = req.body

        if (process.env.STREAMING__OUTPUT_PUBLISH_REQUESTS === "true") {
            console.log("Publish request:", req.body)
        }

        const streamingProfile = await StreamingProfile.findOne({
            stream_key: stream
        })

        if (!streamingProfile) {
            return res.status(404).json({
                code: 1,
                error: "Streaming profile not found",
            })
        }

        const user = await User.findById(streamingProfile.user_id)

        if (!user) {
            return res.status(404).json({
                code: 1,
                error: "User not found",
            })
        }

        const [username, profile_id] = app.split("/")[1].split(":")

        if (user.username !== username) {
            return res.status(403).json({
                code: 1,
                error: "Invalid mount point, username does not match with the stream key",
            })
        }

        if (streamingProfile._id.toString() !== profile_id) {
            return res.status(403).json({
                code: 1,
                error: "Invalid mount point, profile id does not match with the stream key",
            })
        }

        global.websocket_instance.io.emit(`streaming.new`, streamingProfile)

        global.websocket_instance.io.emit(`streaming.new.${streamingProfile.user_id}`, streamingProfile)

        return res.json({
            code: 0,
            status: "ok"
        })
    }
}