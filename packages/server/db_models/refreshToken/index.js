export default {
    name: "RefreshToken",
    collection: "refresh_tokens",
    schema: {
        authToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        }
    }
}