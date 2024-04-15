import requiredFields from "@shared-utils/requiredFields"
import TrackClass from "@classes/track"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        requiredFields(["title", "source"], req.body)

        const track = await TrackClass.create({
            ...req.body,
            user_id: req.auth.session.user_id,
        })

        return track
    }
}