import TrackClass from "@classes/track"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params

        const likeStatus = await TrackClass.isFavourite(
            req.auth.session.user_id,
            track_id,
        )

        return likeStatus
    }
}