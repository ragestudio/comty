export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        return req.auth.session
    }
}