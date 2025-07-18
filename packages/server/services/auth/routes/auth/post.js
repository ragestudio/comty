import AuthToken from "@shared-classes/AuthToken"
import {
	UserConfig,
	UserDHKeyPair,
	MFASession,
	TosViolations,
} from "@db_models"
import obscureEmail from "@shared-utils/obscureEmail"

import Account from "@classes/account"

export default async (req, res) => {
	if (req.body.refreshToken && req.body.authToken) {
		return await AuthToken.handleRefreshToken(req.body)
	}

	if (!req.body.username || !req.body.password) {
		return res.status(400).json({
			error: "Missing username or password",
		})
	}

	const user = await Account.loginStrategy({
		username: req.body.username,
		password: req.body.password,
	})

	const violation = await TosViolations.findOne({
		user_id: user._id.toString(),
	})

	if (violation) {
		return res.status(403).json({
			error: "Terms of service violated",
			violation: violation.toObject(),
		})
	}

	if (user.activated === false) {
		return res.status(401).json({
			code: user.email,
			user_id: user._id.toString(),
			activation_required: true,
		})
	}

	const userConfig = await UserConfig.findOne({
		user_id: user._id.toString(),
	}).catch(() => {
		return {}
	})

	if (userConfig && userConfig.values) {
		if (userConfig.values["auth:mfa"]) {
			let codeVerified = false

			// search if is already a mfa session
			let mfaSession = await MFASession.findOne({ user_id: user._id })

			if (mfaSession) {
				if (!req.body.mfa_code) {
					await MFASession.deleteMany({ user_id: user._id })
				} else {
					if (mfaSession.expires_at < new Date().getTime()) {
						await MFASession.deleteMany({ user_id: user._id })

						throw new OperationError(401, "MFA code expired, login again...")
					}

					if (mfaSession.code == req.body.mfa_code) {
						codeVerified = true

						await MFASession.deleteMany({ user_id: user._id })
					} else {
						throw new OperationError(401, "Invalid MFA code, try again...")
					}
				}
			}

			if (!codeVerified) {
				const mfa = {
					type: "email",
					user_id: user._id,

					code: Math.floor(Math.random() * 9000) + 1000,

					created_at: new Date().getTime(),
					// expires in 1 hour
					expires_at: new Date().getTime() + 60 * 60 * 1000,

					ip_address:
						req.headers["x-forwarded-for"] ??
						req.socket?.remoteAddress ??
						req.ip,
					client: req.headers["user-agent"],
				}

				// create a new mfa session
				mfaSession = new MFASession(mfa)

				await mfaSession.save()

				ipc.invoke("ems", "mfa:send", mfa)

				return {
					message: `MFA required, using [${mfa.type}] method.`,
					method: mfa.type,
					sended_to: obscureEmail(user.email),
					mfa_required: true,
				}
			}
		}
	}

	const authData = {
		date: new Date().getTime(),
		username: user.username,
		user_id: user._id.toString(),
		ip_address:
			req.headers["cf-connecting-ip"] ??
			req.headers["x-forwarded-for"] ??
			req.socket?.remoteAddress ??
			req.ip,
		client: req.headers["user-agent"],
	}

	const token = await AuthToken.createAuthToken(authData)
	const refreshToken = await AuthToken.createRefreshToken(
		authData.user_id,
		token,
	)

	// emit to ems to notify user for the new login, in the background
	try {
		global.queues.createJob("notify-new-login", {
			authData,
			minDate: new Date().getTime() - 3 * 30 * 24 * 60 * 60 * 1000,
			currentToken: token,
		})
	} catch (error) {
		// whoipsi dupsi
		console.error(error)
	}

	return {
		user_id: user._id.toString(),
		token: token,
		refreshToken: refreshToken,
		expiresIn: AuthToken.authStrategy.expiresIn,
	}
}
