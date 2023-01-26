export default {
    name: "SyncEntry",
    collection: "syncEntries",
    schema: {
        user_id: {
            type: "string",
            required: true,
        },
        key: {
            type: "string",
            required: true,
        },
        value: {
            type: "string",
            required: true,
        }
    }
}