import { Track, TrackLike } from "@shared-classes/DbModels"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let likedIds = await TrackLike.find({
        user_id: req.session.user_id,
    })
        .sort({ created_at: -1 })

    likedIds = likedIds.map((item) => {
        return item.track_id
    })

    let tracks = await Track.find({
        _id: [...likedIds],
        //public: true,
    })
        .catch((err) => {
            return []
        })

    tracks = tracks.map((item) => {
        item = item.toObject()

        item.liked = true

        return item
    })

    tracks.sort((a, b) => {
        const indexA = likedIds.indexOf(a._id.toString())
        const indexB = likedIds.indexOf(b._id.toString())

        return indexA - indexB
    })

    return res.json(tracks)
}