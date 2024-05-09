export default async (socket, payload, engine) => {
    const from_user_id = socket.userData._id
    const { to_user_id, is_typing } = payload

    const targetSocket = await engine.find.socketByUserId(to_user_id)

    if (targetSocket) {
        await targetSocket.emit("chat:state:typing", {
            is_typing: is_typing
        })

        // socket.pendingFunctions.push("chats:state:typing")

        // setTimeout(() => {
        //     socket.emit("chats:state:typing", {
        //         is_typing: false,
        //     })
        // }, 5000)
    }
}