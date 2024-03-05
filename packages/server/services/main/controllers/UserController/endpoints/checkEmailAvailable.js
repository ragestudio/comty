import { User } from "@shared-classes/DbModels"

export default {
    method: "GET",
    route: "/email_available",
    fn: async (req, res) => {
        const user = await User.findOne({
            email: req.query.email,
        })

        return res.json({
            available: !user,
        })
    }
}