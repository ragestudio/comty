import { StreamingProfile } from "@models"

export default {
    method: "DELETE",
    route: "/streaming/profile",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()
        const { profile_id } = req.body

        if (!profile_id) {
            return res.status(400).json({
                error: "Invalid request, missing profile_id"
            })
        }

        // search for existing profile
        let currentProfile = await StreamingProfile.findOne({
            _id: profile_id,
        })

        if (!currentProfile) {
            return res.status(400).json({
                error: "Invalid request, profile not found"
            })
        }

        // check if the profile belongs to the user
        if (currentProfile.user_id !== user_id) {
            return res.status(400).json({
                error: "Invalid request, profile does not belong to the user"
            })
        }

        // delete the profile
        await currentProfile.delete()

        return res.json({
            success: true
        })
    }
}