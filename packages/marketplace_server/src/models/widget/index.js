export default {
    name: "Widget",
    collection: "widgets",
    schema: {
        manifest: {
            type: Object,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        public: {
            type: Boolean,
            default: true,
        },
        created_at: {
            type: Date,
        },
        updated_at: {
            type: Date,
        },
    }
}