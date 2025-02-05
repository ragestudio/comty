export default {
    name: "TrackOverride",
    collection: "track_overrides",
    schema: {
        track_id: {
            type: String,
            required: true,
        },
        service: {
            type: String,
        },
        override: {
            type: Object,
            required: true,
        },
    },
}