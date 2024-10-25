export default {
    name: "VotePoll",
    collection: "votes_poll",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        post_id: {
            type: String,
            required: true
        },
        option_id: {
            type: String,
            required: true
        }
    }
}