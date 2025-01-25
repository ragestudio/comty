export default {
    name: "RecentActivity",
    collection: "recent_activity",
    schema: {
        user_id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        payload: {
            type: Object,
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        }
    }
}