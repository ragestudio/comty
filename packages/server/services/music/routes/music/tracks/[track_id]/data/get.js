import TrackClass from "@classes/track"

export default {
    fn: async (req) => {
        const { track_id } = req.params

        const track = await TrackClass.get(track_id)

        return track
    }
}