import { User, UserFollow } from "@lib"

export default {
    method: "GET",
    route: "/user/:user_id/followers",
    fn: async (req, res) => {
        const { limit = 30, offset } = req.query

        let followers = []

        const follows = await UserFollow.find({
            to: req.params.user_id,
        })
            .limit(limit)
            .skip(offset)

        for await (const follow of follows) {
            const user = await User.findById(follow.user_id)

            if (!user) {
                continue
            }

            followers.push(user.toObject())
        }

        return res.json(followers)
    }
}