export default {
    name: "TrackLyric",
    collection: "tracks_lyrics",
    schema: {
        track_id: {
            type: String,
            required: true
        },
        lrc: {
            type: Object,
            default: {}
        },
        video_source: {
            type: String,
        },
        sync_audio_at: {
            type: String,
        }
    }
}