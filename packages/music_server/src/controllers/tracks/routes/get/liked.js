import { Track, TrackLike } from "@shared-classes/DbModels"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let likedTracks = await TrackLike.find({
        user_id: req.session.user_id,
    })
        .sort({ created_at: -1 })

    const likedTracksIds = likedTracks.map((item) => {
        return item.track_id
    })

    let tracks = await Track.find({
        _id: likedTracksIds,
        //public: true,
    })
        .catch((err) => {
            return []
        })

    tracks = tracks.map((item) => {
        item = item.toObject()

        const likeIndex = likedTracksIds.indexOf(item._id.toString())

        if (likeIndex !== -1) {
            item.liked_at = new Date(likedTracks[likeIndex].created_at).getTime()
        }

        item.liked = true

        return item
    })

    tracks.sort((a, b) => {
        const indexA = likedTracksIds.indexOf(a._id.toString())
        const indexB = likedTracksIds.indexOf(b._id.toString())

        return indexA - indexB
    })

    return res.json(tracks)
}