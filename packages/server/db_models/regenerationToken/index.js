export default {
    name: "RegenerationToken",
    collection: "regenerationTokens",
    schema: {
        expiredToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        }
    }
}