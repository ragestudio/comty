import { User, Playlist } from "@models"
import getTrackDataById from "../../TracksController/services/getTrackDataById"

export default async (payload) => {
    const {
        limit = 20,
        skip = 0,
    } = payload

    let playlists = await Playlist.find({
        $or: [
            { public: true },
        ]
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)

    playlists = await Promise.all(playlists.map(async (playlist) => {
        // get user data
        const user = await User.findById(playlist.user_id)

        playlist.list = await Promise.all(playlist.list.map(async (track_id) => {
            return await getTrackDataById(track_id)
        })).catch((err) => {
            return []
        })

        return {
            ...playlist.toObject(),
            user: user.toObject(),
        }
    }))

    return playlists
}