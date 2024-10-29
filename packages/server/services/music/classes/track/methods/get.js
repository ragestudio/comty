import { Track, TrackLike } from "@db_models"

export default async (track_id, { user_id = null, onlyList = false } = {}) => {
    if (!track_id) {
        throw new OperationError(400, "Missing track_id")
    }

    const isMultiple = Array.isArray(track_id) || track_id.includes(",")

    if (isMultiple) {
        const track_ids = Array.isArray(track_id) ? track_id : track_id.split(",")

        const tracks = await Track.find({
            _id: { $in: track_ids }
        }).lean()

        if (user_id) {
            const trackLikes = await TrackLike.find({
                user_id: user_id,
                track_id: { $in: track_ids }
            })

            // FIXME: this could be a performance issue when there are a lot of likes
            // Array.find may not be a good idea
            for (const trackLike of trackLikes) {
                const track = tracks.find(track => track._id.toString() === trackLike.track_id.toString())

                if (track) {
                    track.liked_at = trackLike.created_at
                    track.liked = true
                }
            }
        }

        if (onlyList) {
            return tracks
        }

        return {
            total_count: await Track.countDocuments({ _id: { $in: track_ids } }),
            list: tracks,
        }
    }

    const track = await Track.findOne({
        _id: track_id
    }).lean()

    if (!track) {
        throw new OperationError(404, "Track not found")
    }

    if (user_id) {
        const trackLike = await TrackLike.findOne({
            user_id: user_id,
            track_id: track_id,
        })

        if (trackLike) {
            track.liked_at = trackLike.created_at
            track.liked = true
        }
    }

    return track
}