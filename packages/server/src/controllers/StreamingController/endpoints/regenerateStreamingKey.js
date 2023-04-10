import { StreamingProfile } from "@models"

export default {
    method: "POST",
    route: "/streaming/regenerate_key",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { profile_id } = req.body

        if (!profile_id) {
            return res.status(400).json({
                message: "Missing profile_id"
            })
        }

        const profile = await StreamingProfile.findById(profile_id)

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            })
        }

        // check if profile user is the same as the user in the request
        if (profile.user_id !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to regenerate this key"
            })
        }

        profile.stream_key = global.nanoid()

        await profile.save()

        return res.json(profile.toObject())
    }
}