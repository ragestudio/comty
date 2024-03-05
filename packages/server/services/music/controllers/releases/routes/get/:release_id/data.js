import { Release, TrackLike, Track } from "@shared-classes/DbModels"
import { NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    const { release_id } = req.params
    const { limit, offset } = req.query

    let release = await Release.findOne({
        _id: release_id,
    }).catch((err) => {
        return false
    })

    release = release.toObject()

    if (release.public === false) {
        if (req.session) {
            if (req.session.user_id !== release.user_id) {
                release = false
            }
        } else {
            release = false
        }
    }

    if (!release) {
        return new NotFoundError(req, res, "Release not found")
    }

    const orderedIds = release.list

    release.list = await Track.find({
        _id: [...release.list],
        public: true,
    })

    release.list = release.list.sort((a, b) => {
        return orderedIds.findIndex((id) => id === a._id.toString()) - orderedIds.findIndex((id) => id === b._id.toString())
    })

    if (req.session) {
        const likes = await TrackLike.find({
            user_id: req.session.user_id,
            track_id: [...release.list.map((track) => track._id.toString())],
        })

        release.list = release.list.map((track) => {
            track = track.toObject()

            track.liked = likes.findIndex((like) => like.track_id === track._id.toString()) !== -1

            return track
        })
    }

    return res.json(release)
}