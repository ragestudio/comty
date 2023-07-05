import { Playlist, TrackLike, Track } from "@models"
import { NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    const { playlist_id } = req.params

    let playlist = await Playlist.findOne({
        _id: playlist_id,
    }).catch((err) => {
        return false
    })

    playlist = playlist.toObject()

    if (playlist.public === false) {
        if (req.session) {
            if (req.session.user_id !== playlist.user_id) {
                playlist = false
            }
        } else {
            playlist = false
        }
    }

    if (!playlist) {
        return new NotFoundError(req, res, "Playlist not found")
    }

    const orderedIds = playlist.list

    playlist.list = await Track.find({
        _id: [...playlist.list],
        public: true,
    })

    playlist.list = playlist.list.sort((a, b) => {
        return orderedIds.findIndex((id) => id === a._id.toString()) - orderedIds.findIndex((id) => id === b._id.toString())
    })

    if (req.session) {
        const likes = await TrackLike.find({
            user_id: req.session.user_id,
            track_id: [...playlist.list.map((track) => track._id.toString())],
        })

        playlist.list = playlist.list.map((track) => {
            track = track.toObject()

            track.liked = likes.findIndex((like) => like.track_id === track._id.toString()) !== -1

            return track
        })
    }

    return res.json(playlist)
}