// @ts-ignore
import { Session } from "@db_models"

module.exports = async (job) => {
	const { authData, minDate } = job.data

	try {
		console.log(
			`Checking last login for user ${authData.user_id} from IP ${authData.ip_address}`,
		)
		const session = await Session.find({
			user_id: authData.user_id,
			ip_address: authData.ip_address,
			created_at: { $gte: minDate },
		})

		if (session.length === 0) {
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
