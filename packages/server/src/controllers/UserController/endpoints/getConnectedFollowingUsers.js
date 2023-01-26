import getConnectedUsersFollowing from "../methods/getConnectedUsersFollowing"

export default {
    method: "GET",
    route: "/connected_following_users",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const users = await getConnectedUsersFollowing({
            from_user_id: req.user._id.toString(),
        })

        return res.json(users)
    }
}