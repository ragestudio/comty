import { Playlist, Track } from "@models"
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

    return res.json(playlist)
}