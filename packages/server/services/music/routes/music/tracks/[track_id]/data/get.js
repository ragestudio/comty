import TrackClass from "@classes/track"

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params
        const user_id = req.auth?.session?.user_id

        const track = await TrackClass.get(track_id, {
            user_id
        })

        return track
    }
}