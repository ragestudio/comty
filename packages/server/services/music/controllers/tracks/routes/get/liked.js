import { Track, TrackLike } from "@shared-classes/DbModels"
import { AuthorizationError } from "@shared-classes/Errors"

// TODO: Fetch from external linked services (like tidal, spotify, ...)
export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const { limit = 100, offset = 0 } = req.query

    let totalLikedTracks = await TrackLike.count({
        user_id: req.session.user_id,
    })

    let likedTracks = await TrackLike.find({
        user_id: req.session.user_id,
    })
        .limit(Number(limit))
        .skip(Number(offset))
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

    return res.json({
        total_length: totalLikedTracks,
        tracks,
    })
}