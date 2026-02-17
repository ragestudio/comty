import { ChatMessage } from "@db_models"

export default async (socket, payload, engine) => {
	if (!socket.userData) {
		throw new OperationError(401, "Unauthorized")
	}

	const created_at = new Date().getTime()

	const [from_user_id, to_user_id] = [socket.userData._id, payload.to_user_id]

	const wsMessageObj = {
		...payload,
		created_at: created_at,
		user: socket.userData,
		_id: `msg:${from_user_id}:${created_at}`,
	}

	const doc = await ChatMessage.create({
		type: "user",
		from_user_id: from_user_id,
		to_user_id: to_user_id,
		content: payload.content,
		encrypted: !!payload.encrypted,
		created_at: created_at,
	})

	socket.emit("chat:receive:message", wsMessageObj)

	const targetSocket = await engine.find.socketByUserId(payload.to_user_id)

	if (targetSocket) {
		await targetSocket.emit("chat:receive:message", wsMessageObj)
	}

	return doc
}
