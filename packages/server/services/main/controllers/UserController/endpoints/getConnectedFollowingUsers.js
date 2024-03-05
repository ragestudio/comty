import getConnectedUsersFollowing from "../services/getConnectedUsersFollowing"

export default {
    method: "GET",
    route: "/connected/followers",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const users = await getConnectedUsersFollowing({
            from_user_id: req.user._id.toString(),
        })

        return res.json(users)
    }
}