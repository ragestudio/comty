import {
	UserConfig,
	UserDHKeyPair,
	MFASession,
	TosViolations,
} from "@db_models"
import obscureEmail from "@shared-utils/obscureEmail"

import Account from "@classes/account"
import Session from "@classes/session"

async function handleMFAVerification(user, req) {
	const currentTime = new Date().getTime()
	const mfaSession = await MFASession.findOne({
		user_id: user._id.toString(),
	})

	// handle existing mfa session
	if (mfaSession) {
		// cleanup session if no code provided
		if (!req.body.mfa_code) {
			await MFASession.deleteMany({ user_id: user._id.toString() })
		} else {
			// validate session expiration
			if (mfaSession.expires_at < currentTime) {
				await MFASession.deleteMany({ user_id: user._id.toString() })
				throw new OperationError(
					401,
					"MFA code expired, login again...",
				)
			}

			// validate code
			if (mfaSession.code != req.body.mfa_code) {
				throw new OperationError(401, "Invalid MFA code, try again...")
			}

			// cleanup after successful verification
			await MFASession.deleteMany({ user_id: user._id.toString() })

			// continue with login flow
			return true
		}
	}

	// create new mfa session
	const mfa = {
		type: "email",
		user_id: user._id,
		code: Math.floor(Math.random() * 9000) + 1000,
		created_at: currentTime,
		expires_at: currentTime + 60 * 60 * 1000, // 1 hour
		ip_address:
			req.headers["x-forwarded-for"] ??
			req.socket?.remoteAddress ??
			req.ip,
		client: req.headers["user-agent"],
	}

	await new MFASession(mfa).save()

	ipc.invoke("ems", "mfa:send", mfa)

	return {
		message: `MFA required, using [${mfa.type}] method.`,
		method: mfa.type,
		sended_to: obscureEmail(user.email),
		mfa_required: true,
	}
}

export default async (req, res) => {
	if (req.body.refreshToken && req.body.authToken) {
		return await Session.handleRefresh(req, res)
	}

	if (!req.body.username || !req.body.password) {
		throw new OperationError(400, "Missing username or password")
	}

	// make the login
	const user = await Account.loginStrategy({
		username: req.body.username,
		password: req.body.password,
	})

	// check if is activated, if not, send a activation_required response
	if (user.activated === false) {
		return res.status(401).json({
			code: user.email,
			user_id: user._id.toString(),
			activation_required: true,
		})
	}

	// check if user has any tos violation
	const violation = await TosViolations.findOne({
		user_id: user._id.toString(),
	})

	// if user has any tos violation, throw an error
	if (violation) {
		throw new OperationError(403, "Terms of service violated")
	}

	const userConfig = await UserConfig.findOne({
		user_id: user._id.toString(),
	}).catch(() => {
		return {}
	})

	// check if mfa is enabled for user
	if (userConfig?.values?.["auth:mfa"]) {
		// handle mfa verification
		const mfaResult = await handleMFAVerification(user, req)

		if (mfaResult !== true) {
			return mfaResult
		}
	}

	// create the new session
	const session = await Session.create({
		user_id: user._id.toString(),
		username: user.username,
		flags: user.flags,
		ip_address:
			req.headers["cf-connecting-ip"] ??
			req.headers["x-forwarded-for"] ??
			req.socket?.remoteAddress ??
			req.ip,
		client: req.headers["user-agent"],
	})

	// emit to ems to notify user for the new login, in the background
	try {
		global.queues.createJob("notify-new-login", {
			authData: session.data,
			minDate: new Date().getTime() - 3 * 30 * 24 * 60 * 60 * 1000,
			currentToken: session.authToken,
		})
	} catch (error) {
		// whoipsi dupsi
		console.error(error)
	}

	return {
		user_id: user._id.toString(),
		token: session.authToken,
		refreshToken: session.refreshToken,
		expiresIn: session.expiresIn,
	}
}
