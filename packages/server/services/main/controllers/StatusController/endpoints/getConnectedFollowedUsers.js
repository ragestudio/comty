import { Endpoint } from "linebridge/dist/server"
import getConnectedUsersFollowing from "../services/getConnectedUsersFollowing"

export default class GetConnectedFollowedUsers extends Endpoint {
    static method = "GET"
    static route = "/connected/following"
    static middlewares = ["withAuthentication"]

    async fn(req, res) {
        const users = await getConnectedUsersFollowing({
            from_user_id: req.user._id.toString(),
        })

        return res.json(users)
    }
}