import findSpotifyId from "@services/findSpotifyId"
import { Track } from "@models"
import axios from "axios"

const syncLyricsProvider = `https://spotify-lyric-api.herokuapp.com`
const canvasProvider = `https://api.delitefully.com/api/canvas`

export default async (track, { req }) => {
    if (typeof track !== "object") {
        throw new Error("Track must be an object")
    }

    if (!track._id) {
        throw new Error("Track must have an _id")
    }

    if (!track.lyricsEnabled) {
        throw new Error("Track lyrics are not enabled")
    }

    let lyricData = {
        syncType: null,
        lines: null,
        canvas_url: null,
    }

    if (!track.spotifyId) {
        if (!req.session) {
            throw new Error("Session not found and track has no spotify id")
        }

        const spotifyId = await findSpotifyId({
            track: track.title,
            artist: track.artist,
            sessionToken: req.sessionToken,
        }, { req })

        if (!spotifyId) {
            throw new Error("Track has no spotify id")
        }

        track.spotifyId = spotifyId

        await Track.findOneAndUpdate({
            _id: track._id.toString(),
        }, { spotifyId })
    }

    let { data } = await axios.get(`${syncLyricsProvider}/?trackid=${track.spotifyId}`)

    lyricData.syncType = data.syncType
    lyricData.lines = data.lines

    if (track.videoCanvas) {
        lyricData.canvas_url = track.videoCanvas
    } else {
        try {
            const { data } = await axios.get(`${canvasProvider}/${track.spotifyId}`)

            lyricData.canvas_url = data.canvas_url

            await Track.findOneAndUpdate({
                _id: track._id.toString(),
            }, {
                videoCanvas: data.canvas_url,
            })
        } catch (err) {
            //console.log(err.response.data)
        }
    }

    return lyricData
}