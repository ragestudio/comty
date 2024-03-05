import { Release, Playlist, Track } from "@shared-classes/DbModels"
import TidalAPI from "@shared-classes/TidalAPI"

async function searchRoute(req, res) {
    try {
        const {
            keywords,
            limit = 5,
            offset = 0,
            useTidal = false
        } = req.query

        let results = {
            playlists: [],
            artists: [],
            tracks: [],
            album: [],
            ep: [],
            single: [],
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
                // TODO: Improve searching by album or artist
            }
        }

        let releases = await Release.find(searchQuery)
            .limit(limit)
            .skip(offset)

        if (releases && releases.length > 0) {
            releases.forEach((release) => {
                results[release.type].push(release)
            })
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

        if (toBoolean(useTidal)) {
            const tidalResult = await TidalAPI.search({
                query: keywords
            })

            results.tracks = [...results.tracks, ...tidalResult]
        }

        return res.json(results)
    } catch (error) {
        return res.status(500).json({
            error: error.message,
        })
    }
}

export default (router) => {
    router.get("/", searchRoute)

    return {
        path: "/search",
        router,
    }
}