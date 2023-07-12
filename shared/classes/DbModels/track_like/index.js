export default {
    name: "TrackLike",
    collection: "tracks_likes",
    schema: {
        user_id: {
            type: String,
            required: true,
        },
        track_id: {
            type: String,
            required: true,
        }
    }
}