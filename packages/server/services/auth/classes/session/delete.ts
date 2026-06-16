import SessionModel from "@db/auth_session"
import UserSessionsModel from "@db/user_sessions"
import { Batch } from "@ragestudio/scylla-odm"

export default async function (session_id, user_id) {
	if (!session_id || !user_id) {
		throw new OperationError(400, "Session ID and user ID are required")
	}

	const session = await SessionModel.findOne(
		{
			_id: session_id,
			user_id: user_id,
		},
		{ raw: true },
	)

	if (!session) {
		throw new OperationError(401, "Session not found or not valid")
	}

	const bulk = global.scylla.batch() as Batch

	SessionModel.batch.delete(bulk, {
		_id: session_id,
		user_id: user_id,
	})

	UserSessionsModel.batch.delete(bulk, {
		user_id: user_id,
		session_id: session_id,
	})

	await bulk.execute()

	return session
}
