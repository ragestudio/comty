
import { Track } from "@models"
import getEnhancedLyricsFromTrack from "@services/getEnhancedLyricsFromTrack"

export default async (req, res) => {
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

    if (!track.lyricsEnabled) {
        return res.status(403).json({
            error: "Lyrics disabled for this track",
        })
    }

    const noCache = req.query["no-cache"] === "true"

    let data = null

    if (!noCache) {
        data = await global.redis.get(`lyrics:${track._id.toString()}`)

        if (data) {
            data = JSON.parse(data)
        }
    }

    try {
        if (!data) {
            data = await getEnhancedLyricsFromTrack(track, { req })

            await global.redis.set(`lyrics:${track._id.toString()}`, JSON.stringify(data), "EX", 60 * 60 * 24 * 30)
        }

        if (!data.lines) {
            return res.status(404).json({
                error: "Lyrics not found",
            })
        }

        return res.json(data)
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            error: "Failed to generate lyrics",
        })
    }
}