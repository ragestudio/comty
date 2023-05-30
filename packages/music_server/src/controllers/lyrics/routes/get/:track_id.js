const syncLyricsProvider = `https://spotify-lyric-api.herokuapp.com`
const canvasProvider = `https://api.delitefully.com/api/canvas`

import { Track } from "@models"
import axios from "axios"

const clearQueryRegexs = [
    // remove titles with (feat. Something)
    new RegExp(/\(feat\..*\)/, "gi"),
    // remplace $ with S
    new RegExp(/\$/, "gi"),
    // remove special characters
    new RegExp(/[\(\)\[\]\$\&\*\#\@\!\%\+\=\_\-\:\;\'\"\,\.]/, "gi"),
    // remove words like "official video", "official audio", "official music video"
    new RegExp(/official\s(video|audio|music\svideo)/, "gi"),
]

async function findSpotifyTrack({
    title,
    artist,
    sessionToken,
} = {}) {
    let query = `${title} artist:${artist}`

    // run clear query regexs
    for (const regex of clearQueryRegexs) {
        query = query.replace(regex, "")
    }

    const { data } = await global.comty.instances.default({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${sessionToken}`,
        },
        params: {
            query: query,
            type: "track",
        },
        url: "/sync/spotify/search",
    }).catch((error) => {
        console.error(error.response.data)

        return null
    })

    if (!data) {
        return null
    }

    return data.tracks.items[0]
}

export default async (req, res) => {
    const noCache = req.query["no-cache"] === "true"

    let track = await Track.findOne({
        _id: req.params.track_id,
    }).catch((error) => {
        return null
    })

    if (!track) {
        return res.status(404).json({
            error: "Track not found",
        })
    }

    console.log(track)

    if (!track.lyricsEnabled) {
        return res.status(403).json({
            error: "Lyrics disabled for this track",
        })
    }

    //console.log("Found track", track)

    track = track.toObject()

    let lyricData = {
        syncType: null,
        lines: null,
        canvas_url: null,
    }

    let cachedData = null

    try {
        if (!noCache) {
            cachedData = await global.redis.get(`lyrics:${track._id}`)

            if (cachedData) {
                lyricData = JSON.parse(cachedData)
            }

            if (track.videoCanvas) {
                lyricData.canvas_url = track.videoCanvas
            }
        }

        if (!cachedData) {
            // no cache, recosntruct lyrics data

            // first check if track has spotify id to fetch the lyrics
            // if not present, try to search from spotify api and update the track with the spotify id
            if (!track.spotifyId) {
                if (!req.session) {
                    throw new Error("Session not found and track has no spotify id")
                }

                console.log("Fetching spotify track")

                const spotifyTrack = await findSpotifyTrack({
                    title: track.title,
                    artist: track.artist,
                    sessionToken: req.sessionToken,
                })

                console.log(spotifyTrack)

                if (spotifyTrack.id) {
                    track.spotifyId = spotifyTrack.id

                    console.log("Updating track with spotify id")

                    const result = await Track.findOneAndUpdate({
                        _id: track._id.toString(),
                    }, {
                        spotifyId: spotifyTrack.id,
                    })

                    console.log(result)
                } else {
                    throw new Error("Failed to search spotify id")
                }
            }

            // ok now we have the spotify id, try to fetch the lyrics
            console.log("Fetching lyrics from sync provider, ID:", track.spotifyId)

            let { data } = await axios.get(`${syncLyricsProvider}/?trackid=${track.spotifyId}`)

            lyricData.syncType = data.syncType
            lyricData.lines = data.lines

            // so we have the lyrics, now check if track has videoCanvas
            // if not present, try to fetch from canvas provider and update the track with the videoCanvas
            // handle errors silently
            if (track.videoCanvas) {
                lyricData.canvas_url = track.videoCanvas
            } else {
                try {
                    console.log("Fetching canvas for id", track.spotifyId)

                    const { data } = await axios.get(`${canvasProvider}/${track.spotifyId}`)

                    lyricData.canvas_url = data.canvas_url

                    console.log("Updating track with canvas url")

                    await Track.findOneAndUpdate({
                        _id: track._id.toString(),
                    }, {
                        videoCanvas: data.canvas_url,
                    })
                } catch (error) {
                    console.error(error)
                }
            }

            // force rewrite cache
            await global.redis.set(`lyrics:${track._id}`, JSON.stringify(data))

            // check
            // const _cachedData = await global.redis.get(`lyrics:${track._id}`)

            // console.log("Cached data", _cachedData, data)
        }
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            error: `Failed to generate lyrics for track ${track._id}`,
        })
    }

    if (!lyricData.lines) {
        return res.status(404).json({
            error: "Lyrics not found",
        })
    }

    //console.log("Lyrics data", lyricData)

    return res.json(lyricData)
}