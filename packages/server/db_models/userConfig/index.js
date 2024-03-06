export default {
    name: "UserConfig",
    collection: "user_config",
    schema: {
        user_id: { type: String, required: true },
        values: { type: Object, default: {} },
    }
}