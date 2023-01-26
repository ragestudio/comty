import lodash from "lodash"
import { User } from "@models"

const AllowedAnonPublicGetters = [
    "_id",
    "username",
    "fullName",
    "avatar",
    "roles"
]

export default {
    method: "GET",
    route: "/public_data",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        let user = req.query?.username ?? req.user.username

        if (!user) {
            return res.status(400).json({
                error: "No user provided",
            })
        }

        user = await User.findOne({
            username: user,
        }).catch(() => null)

        if (!user) {
            return res.json({
                user: null,
            })
        }

        user = lodash.pick(user, AllowedAnonPublicGetters)

        return res.json(user)
    }
}