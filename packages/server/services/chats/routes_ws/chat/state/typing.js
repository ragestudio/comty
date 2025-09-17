export default async (socket, payload, engine) => {
    if (!socket.userData) {
        throw new OperationError(401, "Unauthorized")
    }

    const from_user_id = socket.userData._id
    const { to_user_id, is_typing } = payload

    const targetSocket = await engine.find.socketByUserId(to_user_id)

    if (targetSocket && targetSocket.emit) {
        await targetSocket.emit("chat:state:typing", {
            from_user_id: from_user_id,
            is_typing: is_typing
        })
    }
}