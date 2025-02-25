import { User, PasswordRecover } from "@db_models"
import AuthToken from "@shared-classes/AuthToken"

import obscureEmail from "@shared-utils/obscureEmail"
import isEmail from "@shared-utils/isEmail"

function getClientDeviceData(req) {
	const ip =
		req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? req.ip
	const userAgent = req.headers["user-agent"]

	return { ip_address: ip, client: userAgent }
}

export default {
	fn: async (req) => {
		// find user by email or username
		const { account } = req.body

		const userSearchQuery = {}

		if (isEmail(account)) {
			userSearchQuery.email = account
		} else {
			userSearchQuery.username = account
		}

		const user = await User.findOne(userSearchQuery).select("+email")

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		let passwordRecoverSession = await PasswordRecover.findOne({
			user_id: user._id.toString(),
		})

		// check if session exist, and if it's expired
		if (passwordRecoverSession) {
			const now = new Date()
			const expires = passwordRecoverSession.expires_at

			// if not expired, thow a error
			if (expires > now) {
				throw new OperationError(
					400,
					"Password recovery session is still active",
				)
			} else {
				// destroy session
				await PasswordRecover.findOneAndDelete({
					_id: passwordRecoverSession._id.toString(),
				})
			}
		}

		// expires in 5 minutes
		const expiresIn = 1000 * 60 * 5

		passwordRecoverSession = new PasswordRecover({
			user_id: user._id.toString(),
			created_at: new Date(),
			expires_at: new Date(Date.now() + expiresIn),
			code: global.nanoid(8),
			...getClientDeviceData(req),
		})

		await passwordRecoverSession.save()

		const verificationToken = await AuthToken.signToken({
			recoverySessionId: passwordRecoverSession._id.toString(),
			user_id: user._id.toString(),
		})

		ipc.invoke("ems", "apr:send", {
			code: passwordRecoverSession.code,
			created_at: passwordRecoverSession.created_at,
			expires_at: passwordRecoverSession.expires_at,
			user: user.toObject(),
			...getClientDeviceData(req),
		})

		return {
			user_id: user._id.toString(),
			email: obscureEmail(user.email),
			expires_at: passwordRecoverSession.expires_at,
			expires_in: Math.floor(
				(passwordRecoverSession.expires_at - Date.now()) / 1000 / 60,
			),
			code_length: passwordRecoverSession.code.toString().length,
			verificationToken: verificationToken,
		}
	},
}
