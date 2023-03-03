import { User, Badge } from "@models"

export default {
    method: "GET",
    route: "/user/:user_id",
    fn: async (req, res) => {
        const user = await User.findOne({
            _id: req.params.user_id,
        })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const badges = await Badge.find({
            name: { $in: user.badges },
        })

        return res.json(badges)
    }
}