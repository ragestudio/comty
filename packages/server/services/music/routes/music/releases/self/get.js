import { Playlist, Release, Track } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { keywords, limit = 10, offset = 0 } = req.query

        const user_id = req.auth.session.user_id

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

        const playlistsCount = await Playlist.count(searchQuery)
        const releasesCount = await Release.count(searchQuery)

        let total_length = playlistsCount + releasesCount

        let playlists = await Playlist.find(searchQuery)
            .sort({ created_at: -1 })
            .limit(limit)
            .skip(offset)

        playlists = playlists.map((playlist) => {
            playlist = playlist.toObject()

            playlist.type = "playlist"

            return playlist
        })

        let releases = await Release.find(searchQuery)
            .sort({ created_at: -1 })
            .limit(limit)
            .skip(offset)

        let result = [...playlists, ...releases]

        if (req.query.resolveItemsData === "true") {
            result = await Promise.all(
                playlists.map(async playlist => {
                    playlist.list = await Track.find({
                        _id: [...playlist.list],
                    })

                    return playlist
                }),
            )
        }

        return {
            total_length: total_length,
            items: result,
        }
    }
}