import { StreamingProfile } from "@models"

export default {
    method: "GET",
    route: "/profile/streamkey/:streamkey",
    fn: async (req, res) => {
        const profile = await StreamingProfile.findOne({
            stream_key: req.params.streamkey
        })

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found"
            })
        }

        return res.json(profile)
    }
}