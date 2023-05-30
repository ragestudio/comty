import { Playlist, Track } from "@models"
import { AuthorizationError, NotFoundError } from "@classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const { keywords, limit = 10, offset = 0 } = req.query
    const user_id = req.session.user_id.toString()

    let searchQuery = {
        user_id,
    }

    if (keywords) {
        searchQuery = {
            ...searchQuery,
            title: {
                $regex: keywords,
                $options: "i",
            },
        }
    }

    let playlists = await Playlist.find(searchQuery)
        .catch((err) => false)
    //.limit(limit)
    //.skip(offset)

    if (!playlists) {
        return new NotFoundError("Playlists not found")
    }

    playlists = await Promise.all(playlists.map(async (playlist) => {
        playlist.list = await Track.find({
            _id: [
                ...playlist.list,
            ]
        })

        return playlist
    }))

    return res.json(playlists)
}