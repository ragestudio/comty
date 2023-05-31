import { Playlist } from "@models"
import { AuthorizationError, PermissionError, NotFoundError } from "@classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let playlist = await Playlist.findOne({
        _id: req.params.playlist_id,
    }).catch((err) => {
        return false
    })

    if (!playlist) {
        return new NotFoundError(req, res, "Playlist not found")
    }

    if (playlist.user_id !== req.session.user_id.toString()) {
        return new PermissionError(req, res, "You don't have permission to edit this playlist")
    }

    await Playlist.deleteOne({
        _id: req.params.playlist_id,
    })

    return res.json({
        success: true,
    })
}