export default {
    "post_id": {
        type: "string",
        required: true,
    },
    "user_id": {
        type: "string",
        required: true,
    },
    "saved_at":{
        type: "date",
        default: Date.now,
    }
}