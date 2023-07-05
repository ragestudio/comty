export default function composePayloadData(socket, data = {}) {
    return {
        user: {
            user_id: socket.userData._id,
            username: socket.userData.username,
            fullName: socket.userData.fullName,
            avatar: socket.userData.avatar,
        },
        command_issuer: data.command_issuer ?? socket.userData._id,
        ...data
    }
}