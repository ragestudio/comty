export default {
    name: "TrackLyric",
    collection: "tracks_lyrics",
    schema: {
        track_id: {
            type: String,
            required: true
        },
        lrc: {
            type: String,
        }
    }
}