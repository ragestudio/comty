import { Session } from "@models"

export default {
    method: "POST",
    route: "/logout",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { token, user_id } = req.body

        if (typeof user_id === "undefined") {
            return res.status(400).json("No user_id provided")
        }
        if (typeof token === "undefined") {
            return res.status(400).json("No token provided")
        }

        const session = await Session.findOneAndDelete({ user_id, token })

        if (session) {
            return res.json("done")
        }

        return res.status(404).json("not found")
    },
}