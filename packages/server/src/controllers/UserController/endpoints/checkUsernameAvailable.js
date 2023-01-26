import { User } from "@models"

export default {
    method: "GET",
    route: "/username_available",
    fn: async (req, res) => {
        const user = await User.findOne({
            username: req.query.username,
        })

        return res.json({
            available: !user,
        })
    }
}