export default {
    method: "DELETE",
    route: "/all",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        const allSessions = await Session.deleteMany({ user_id })

        if (allSessions) {
            return res.json("done")
        }

        return res.status(404).json("not found")
    }
}