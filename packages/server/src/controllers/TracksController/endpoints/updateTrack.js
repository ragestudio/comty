import { Track } from "@models"

const allowedUpdateFields = [
    "title",
    "tags",
    "thumbnail",
    "source",
]

export default {
    method: "PUT",
    route: "/:track_id",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { payload } = req.body

        if (!payload) {
            return res.status(400).json({
                message: "Payload is required"
            })
        }

        let track = await Track.findById(req.params.track_id).catch((err) => false)

        if (!track) {
            return res.status(404).json({
                message: "Track not found"
            })
        }

        // check if the user is the owner of the track
        if (req.user._id.toString() !== track.user_id.toString()) {
            return res.status(403).json({
                message: "You are not the owner of this track"
            })
        }

        // update the track
        allowedUpdateFields.forEach((key) => {
            track[key] = payload[key] || track[key]
        })

        await track.save()

        return res.json(track)
    }
}