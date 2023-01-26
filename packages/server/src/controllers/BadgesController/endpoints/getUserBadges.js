import { User, Badge } from "@models"

export default {
    method: "GET",
    route: "/user",
    fn: async (req, res) => {
        const user = await User.findOne({ _id: req.query.user_id ?? req.user._id })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const badges = await Badge.find({
            name: { $in: user.badges },
        })

        return res.json(badges)
    }
}