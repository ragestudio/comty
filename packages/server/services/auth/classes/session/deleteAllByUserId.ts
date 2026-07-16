import UserSessionsModel from "@db/user_sessions"
import SessionsModel from "@db/auth_session"

export default async function (user_id) {
	if (!user_id) {
		throw new OperationError(400, "User ID is required")
	}

	const userSessions = await UserSessionsModel.find(
		{
			user_id: user_id,
		},
		{
			raw: true,
		},
	)

	const sessions = await SessionsModel.find({
		_id: {
			$in: userSessions.map((s) => s.session_id),
		},
		user_id: user_id,
	})

	for await (const session of sessions) {
		await session.delete()
	}

	return sessions.length
}
