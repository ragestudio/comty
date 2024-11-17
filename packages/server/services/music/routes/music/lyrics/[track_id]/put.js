import { TrackLyric, Track } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { track_id } = req.params
        const { video_source, lrc, sync_audio_at } = req.body

        let track = await Track.findOne({
            _id: track_id,
        })

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
            track: track,
        })

        let trackLyric = await TrackLyric.findOne({
            track_id: track_id
        }).lean()

        if (trackLyric) {
            if (video_source) {
                trackLyric.video_source = video_source
            }

            if (lrc) {
                trackLyric.lrc = lrc
            }

            if (sync_audio_at) {
                trackLyric.sync_audio_at = sync_audio_at
            }

            trackLyric = await TrackLyric.findOneAndUpdate({
                track_id: track_id
            },
                trackLyric
            )
        } else {
            trackLyric = new TrackLyric({
                track_id: track_id,
                video_source: video_source,
                lrc: lrc,
                sync_audio_at: sync_audio_at,
            })

            await trackLyric.save()
        }

        return trackLyric
    }
}