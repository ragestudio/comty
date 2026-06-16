import UserSessions from "@db/user_sessions"
import AuthSession from "@db/auth_session"

module.exports = async (job) => {
	const { authData, minDate } = job.data

	try {
		console.log(
			`Checking last login for user ${authData.user_id} from IP ${authData.ip_address}`,
		)

		const userSessions = await UserSessions.find(
			{
				user_id: authData.user_id,
			},
			{
				raw: true,
			},
		)

		let sessions = await AuthSession.find(
			{
				_id: {
					$in: userSessions.map((s) => s.session_id),
				},
				user_id: authData.user_id,
			},
			{
				raw: true,
			},
		)

		const isKnownSessions = sessions.some((s) => {
			const isDifferentSession = s._id !== authData._id
			const isSameIP = s.ip_address === authData.ip_address

			const isRecentEnough = s.created_at.getTime() >= minDate

			return isDifferentSession && isSameIP && isRecentEnough
		})

		if (!isKnownSessions) {
			console.log(
				`No session found for user ${authData.user_id} from IP ${authData.ip_address}...`,
				"Sending notification",
			)

			global.ipc.invoke("ems", "new:login", authData)
		}
	} catch (error) {
		console.error(error)
	}
}
