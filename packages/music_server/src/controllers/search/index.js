import { Playlist, Track } from "@shared-classes/DbModels"
import TidalAPI from "@shared-classes/TidalAPI"

async function searchRoute(req, res) {
    const {
        keywords,
        limit = 5,
        offset = 0,
        useTidal = false
    } = req.query

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
            // TODO: Improve searching by album or artist
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

    if (toBoolean(useTidal)) {
        const tidalResult = await TidalAPI.search({
            query: keywords
        })

        tidalResult.tracks.items.forEach((element) => {
            element._id = element.id

            const coverUID = element.album.cover.replace(/-/g, "/")

            element.cover = `https://resources.tidal.com/images/${coverUID}/1280x1280.jpg`

            element.artist = element.artists.map(artist => artist.name).join(", ")

            element.metadata = {
                title: element.title,
                artists: element.artists.map(artist => artist.name).join(", "),
                artist: element.artists.map(artist => artist.name).join(", "),
                album: element.album.title,
                duration: element.duration
            }

            element.service = "tidal"

            results.tracks.push(element)
        })
    }

    return res.json(results)
}

export default (router) => {
    router.get("/", searchRoute)

    return {
        path: "/search",
        router,
    }
}