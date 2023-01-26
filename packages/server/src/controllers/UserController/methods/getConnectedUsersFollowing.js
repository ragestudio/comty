import { UserFollow } from "@models"

export default async (payload = {}) => {
    const { from_user_id } = payload

    // get all the users that are following
    const following = await UserFollow.find({
        user_id: from_user_id,
    })

    // check if following users are connected
    const connectedUsers = []

    following.forEach((follow) => {
        const connectedClient = global.wsInterface.clients.find((client) => {
            return client.user_id === follow.to
        })

        if (connectedClient) {
            connectedUsers.push(connectedClient.user_id)
        }
    })

    return connectedUsers
}