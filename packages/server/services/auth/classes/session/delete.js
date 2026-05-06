import SessionModel from "@db/auth_session"

export default async function (session_id) {
	const session = await SessionModel.findOne({
		_id: session_id,
	})

	if (!session) {
		throw new OperationError(401, "Session not found or not valid")
	}

	await session.delete()

	return session.toRaw()
}
