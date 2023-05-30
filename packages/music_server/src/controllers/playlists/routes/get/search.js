import { Playlist, Track } from "@models"

export default async (req, res) => {
    const { keywords, limit = 5, offset = 0 } = req.query

    let results = {
        playlists: [],
        artists: [],
        albums: [],
        tracks: [],
    }

    let searchQuery = {
        public: true,
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
        .limit(limit)
        .skip(offset)

    if (playlists) {
        results.playlists = playlists
    }

    let tracks = await Track.find(searchQuery)
        .limit(limit)
        .skip(offset)

    if (tracks) {
        results.tracks = tracks
    }

    return res.json(results)
}