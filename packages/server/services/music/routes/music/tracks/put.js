import requiredFields from "@shared-utils/requiredFields"
import TrackClass from "@classes/track"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        if (Array.isArray(req.body.list)) {
            let results = []

            for await (const item of req.body.list) {
                requiredFields(["title", "source"], item)

                const track = await TrackClass.create({
                    ...item,
                    user_id: req.auth.session.user_id,
                })

                results.push(track)
            }

            return {
                list: results
            }
        }

        requiredFields(["title", "source"], req.body)

        const track = await TrackClass.create({
            ...req.body,
            user_id: req.auth.session.user_id,
        })

        return track
    }
}