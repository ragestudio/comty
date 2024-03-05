export default {
    method: "GET",
    route: "/current",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        return res.json(req.currentSession)
    }
}