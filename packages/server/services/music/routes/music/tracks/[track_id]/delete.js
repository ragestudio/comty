import TrackClass from "@classes/track"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params

        const track = await TrackClass.get(track_id)

        if (track.publisher.user_id !== req.auth.session.user_id) {
            throw new Error("Forbidden, you don't own this track")
        }

        await TrackClass.delete(track_id)

        return {
            success: true,
            track: track,
        }
    }
}