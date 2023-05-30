import { Playlist } from "@models"

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

    return playlists
}