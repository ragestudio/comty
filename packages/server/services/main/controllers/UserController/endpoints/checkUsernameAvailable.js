import { User } from "@shared-classes/DbModels"

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