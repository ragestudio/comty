import { Track } from "@models"
import { NotFoundError } from "@classes/Errors"
import getEnhancedLyricsFromTrack from "@services/getEnhancedLyricsFromTrack"

export default async (req, res) => {
    const { track_id } = req.params

    let track = await Track.findOne({
        _id: track_id,
        public: true,
    }).catch((err) => {
        return null
    })

    if (!track) {
        return new NotFoundError(req, res, "Track not found")
    }

    if (track.lyricsEnabled) {
        const enhancedLyrics = await getEnhancedLyricsFromTrack(track, { req }).catch((err) => {
            return false
        })

        if (enhancedLyrics) {
            await global.redis.set(`lyrics:${track._id.toString()}`, JSON.stringify(enhancedLyrics), "EX", 60 * 60 * 24 * 30)
        }
    }

    return res.json({
        success: true,
    })
}