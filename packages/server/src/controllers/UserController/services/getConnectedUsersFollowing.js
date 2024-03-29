import { UserFollow } from "@shared-classes/DbModels"

export default async (payload = {}) => {
    const { from_user_id } = payload

    // get all the users that are following
    const following = await UserFollow.find({
        user_id: from_user_id,
    })

    // check if following users are connected
    const connectedUsers = []

    following.forEach((follow) => {
        const connectedClient = global.websocket_instance.clients.find((client) => {
            return client.user_id === follow.to
        })

        if (connectedClient) {
            connectedUsers.push(connectedClient.user_id)
        }
    })

    return connectedUsers
}