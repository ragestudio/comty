import { Session } from "@db_models"

module.exports = async (job) => {
	const { authData, minDate, ignoreToken } = job.data

	try {
		console.log(
			`Checking last login for user ${authData.user_id} from IP ${authData.ip_address}`,
		)
		const session = await Session.findOne({
			user_id: authData.user_id,
			ip_address: authData.ip_address,
			created_at: { $gte: minDate },
			token: { $ne: authData.token },
		})

		if (!session) {
			console.log(
				`No session found for user ${authData.user_id} from IP ${authData.ip_address}`,
			)
			console.log("Sending notification")
			global.ipc.call("ems", "new:login", authData).catch((error) => {
				// whoipsi dupsi
				console.error(error)
			})
		}
	} catch (error) {
		console.error(error)
	}
}
