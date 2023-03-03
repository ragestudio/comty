import { User } from "@models"

export default {
    method: "GET",
    route: "/user_id/:username",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user = await User.findOne({ username: req.params.username })

        if (!user) {
            return res.status(404).json({ error: "User not exists" })
        }

        return res.json({
            username: user.username,
            user_id: user._id,
        })
    }
}