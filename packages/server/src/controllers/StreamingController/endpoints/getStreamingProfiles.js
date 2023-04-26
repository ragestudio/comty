import { StreamingProfile } from "@models"
import NewStreamingProfile from "@services/newStreamingProfile"

export default {
    method: "GET",
    route: "/streaming/profiles",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        if (!user_id) {
            return res.status(400).json({
                error: "Invalid request, missing user_id"
            })
        }

        let profiles = await StreamingProfile.find({
            user_id,
        }).select("+stream_key")

        if (profiles.length === 0) {
            // create a new profile
            const profile = await NewStreamingProfile({
                user_id,
                profile_name: "default",
            })

            profiles = [profile]
        }

        profiles = profiles.map((profile) => {
            profile = profile.toObject()

            profile._id = profile._id.toString()

            profile.stream_key = `${req.user.username}:${profile._id}?secret=${profile.stream_key}`

            return profile
        })

        profiles = profiles.map((profile) => {
            profile.addresses = {
                ingest: process.env.STREAMING_INGEST_SERVER,
                hls: `${process.env.STREAMING_API_SERVER}/live/${req.user.username}:${profile._id}/src.m3u8`,
                flv: `${process.env.STREAMING_API_SERVER}/live/${req.user.username}:${profile._id}/src.flv`,
                aac: `${process.env.STREAMING_API_SERVER}/radio/${req.user.username}:${profile._id}/src.aac`,
            }

            return profile
        })

        return res.json(profiles)
    }
}