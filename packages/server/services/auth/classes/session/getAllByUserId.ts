import UserSessionModel from "@db/user_sessions"
import SessionModel from "@db/auth_session"

export default async function (user_id: string) {
	const sessions = await UserSessionModel.find(
		{
			user_id: user_id,
		},
		{
			raw: true,
		},
	)

	return await SessionModel.find(
		{
			_id: {
				$in: sessions.map((s) => s.session_id),
			},
			user_id: user_id,
		},
		{
			raw: true,
		},
	)
}
