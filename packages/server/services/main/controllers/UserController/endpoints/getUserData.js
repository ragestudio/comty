import lodash from "lodash"
import { User } from "@db_models"

const publicGetters = [
    "_id",
    "username",
    "fullName",
    "avatar",
    "roles",
    "badges",
    "cover",
    "verified",
    "description",
    "links",
    "createdAt",
]

export default {
    method: "GET",
    route: "/:user_id/data",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let user = await User.findOne({
            _id: req.params.user_id,
        })

        if (!user) {
            return res.status(404).json({ error: "User not exists" })
        }

        if (req.user.roles.includes("admin")) {
            return res.json(user)
        }

        if (req.user._id.toString() !== user._id.toString()) {
            user = lodash.pick(user, publicGetters)
        }

        return res.json(user)
    }
}