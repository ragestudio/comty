import { Track } from "@db_models"
import { NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    const { track_id } = req.params

    let track = await Track.findOne({
        _id: track_id,
        public: true,
    }).catch((err) => {
        return null
    })

    if (!track) {
        return new NotFoundError(req, res, "Track not found")
    }

    return res.json(track)
}