import { TrackLyric, Track } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params
        const { video_source, lrc, sync_audio_at } = req.body

        // check if track exists
        let track = await Track.findById(track_id).catch(() => null)

        if (!track) {
            throw new OperationError(404, "Track not found")
        }

        if (track.publisher.user_id !== req.auth.session.user_id) {
            throw new OperationError(403, "Unauthorized")
        }

        console.log(`Setting lyrics for track ${track_id} >`, {
            track_id: track_id,
            video_source: video_source,
            lrc: lrc,
        })

        // check if trackLyric exists
        let trackLyric = await TrackLyric.findOne({
            track_id: track_id
        })

        // if trackLyric exists, update it, else create it
        if (!trackLyric) {
            trackLyric = new TrackLyric({
                track_id: track_id,
                video_source: video_source,
                lrc: lrc,
                sync_audio_at: sync_audio_at,
            })

            await trackLyric.save()
        } else {
            const update = Object()

            if (typeof video_source !== "undefined") {
                update.video_source = video_source
            }

            if (typeof lrc !== "undefined") {
                update.lrc = lrc
            }

            if (typeof sync_audio_at !== "undefined") {
                update.sync_audio_at = sync_audio_at
            }

            trackLyric = await TrackLyric.findOneAndUpdate(
                {
                    track_id: track_id,
                },
                update,
            )
        }

        return trackLyric
    }
}