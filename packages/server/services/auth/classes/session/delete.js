import SessionModel from "@db/auth_session"

export default async function (session_id, user_id) {
	if (!session_id || !user_id) {
		throw new OperationError(400, "Session ID and user ID are required")
	}

	const session = await SessionModel.findOne({
		_id: session_id,
		user_id: user_id,
	})

	if (!session) {
		throw new OperationError(401, "Session not found or not valid")
	}

	await session.delete()

	return session.toRaw()
}
