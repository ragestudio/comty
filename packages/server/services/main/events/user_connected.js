import { UserFollow } from "@shared-classes/DbModels"

export default async (user_id) => {
    // get followers of the user
    const followers = await UserFollow.find({
        to: user_id,
    })

    // send event to ws clients (if are connected)
    followers.forEach((follow) => {
        const connectedClient = global.websocket_instance.clients.find((client) => {
            return client.user_id === follow.user_id
        })

        if (connectedClient) {
            connectedClient.socket.emit("friend.connected", user_id)
        }
    })
}