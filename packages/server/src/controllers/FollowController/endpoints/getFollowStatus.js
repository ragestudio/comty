import { UserFollow } from "@models"

export default {
    method: "GET",
    route: "/user/:user_id/is_followed",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const isFollowed = await UserFollow.findOne({
            user_id: req.user._id.toString(),
            to: req.params.user_id,
        }).catch(() => false)

        return res.json({
            isFollowed: Boolean(isFollowed),
        })
    }
}