import TrackClass from "@classes/track"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params
        const { to } = req.body

        const track = await TrackClass.toggleFavourite(
            req.auth.session.user_id,
            track_id,
            to,
        )

        return track
    }
}