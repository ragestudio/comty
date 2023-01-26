import { Session } from "@models"

export default {
    method: "DELETE",
    route: "/",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { token } = req.body
        const user_id = req.user._id.toString()

        if (typeof token === "undefined") {
            return res.status(400).json("No token provided")
        }

        const session = await Session.findOneAndDelete({ user_id, token })

        if (session) {
            return res.json({
                message: "done",
            })
        }

        return res.status(404).json({
            error: "Session not found",
        })
    },
}