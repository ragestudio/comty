import { Session } from "@models"

export default {
    method: "GET",
    route: "/all",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const sessions = await Session.find({ user_id: req.user._id.toString() }, { token: 0 })
            .sort({ date: -1 })

        return res.json(sessions)
    },
}