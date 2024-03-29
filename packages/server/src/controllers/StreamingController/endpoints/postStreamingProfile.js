import { StreamingProfile } from "@shared-classes/DbModels"
import NewStreamingProfile from "@services/newStreamingProfile"

const AllowedChangesFields = ["profile_name", "info", "options"]

export default {
    method: "POST",
    route: "/streaming/profile",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        if (!user_id) {
            return res.status(400).json({
                error: "Invalid request, missing user_id"
            })
        }

        const {
            profile_id,
            profile_name,
            info,
            options,
        } = req.body

        if (!profile_id && !profile_name) {
            return res.status(400).json({
                error: "Invalid request, missing profile_id and profile_name"
            })
        }

        // search for existing profile
        let currentProfile = await StreamingProfile.findOne({
            _id: profile_id,
        })

        if (currentProfile && profile_id) {
            // update the profile
            AllowedChangesFields.forEach((field) => {
                if (req.body[field]) {
                    currentProfile[field] = req.body[field]
                }
            })

            await currentProfile.save()
        } else {
            if (!profile_name) {
                return res.status(400).json({
                    error: "Invalid request, missing profile_name"
                })
            }

            // create a new profile
            currentProfile = await NewStreamingProfile({
                user_id,
                profile_name,
                info,
                options,
            })
        }

        return res.json(currentProfile)
    }
}