import { StreamingProfile } from "@models"
import NewStreamingProfile from "@services/newStreamingProfile"
import composeStreamingSources from "@utils/compose-streaming-sources"

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
            profile.addresses = composeStreamingSources(req.user.username, profile._id)

            return profile
        })

        return res.json(profiles)
    }
}