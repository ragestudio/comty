import bcrypt from "bcrypt"
import { User, OperationLog, PasswordRecover, PasswordHash } from "@db_models"
import Account from "@classes/account"
import AuthToken from "@shared-classes/AuthToken"

export default async (
	{
		user_id,
		old_hash,
		old_password,
		new_password,
		code,
		verificationToken,
		log_comment,
	},
	req,
) => {
	if (!code && !old_password) {
		throw new OperationError(
			400,
			"Either code or old_password must be provided",
		)
	}

	let verificationTokenDecoded = null

	if (verificationToken) {
		verificationTokenDecoded =
			await AuthToken.basicDecode(verificationToken)
	}

	let user = await User.findById(user_id || verificationTokenDecoded?.user_id)

	let passwordHash = await PasswordHash.findOne({
		user_id: user_id || verificationTokenDecoded?.user_id,
	})

	if (!user || !passwordHash) {
		throw new OperationError(404, "User not found")
	}

	if (code) {
		const passwordRecoverSession = await PasswordRecover.findOne({ code })

		if (!passwordRecoverSession) {
			throw new OperationError(401, "Invalid code")
		}

		if (
			verificationTokenDecoded.recoverySessionId !==
			passwordRecoverSession._id.toString()
		) {
			throw new OperationError(401, "Invalid code")
		}

		if (passwordRecoverSession.expires < Date.now()) {
			throw new OperationError(401, "Code expired")
		}

		// delete passwordRecoverSession
		await PasswordRecover.findByIdAndDelete(
			passwordRecoverSession._id.toString(),
		)
	} else {
		user = await Account.loginStrategy(
			{ password: old_password, hash: old_hash },
			user,
		)
	}

	await Account.passwordMeetPolicy(new_password)

	passwordHash.hash = bcrypt.hashSync(
		new_password,
		parseInt(process.env.BCRYPT_ROUNDS ?? 3),
	)

	await passwordHash.save()

	const operation = {
		type: "password:changed",
		user_id: user._id.toString(),
		date: Date.now(),
		comments: [],
	}

	if (log_comment) {
		operation.comments.push(log_comment)
	}

	if (typeof req === "object") {
		operation.ip_address =
			req.headers["x-forwarded-for"]?.split(",")[0] ??
			req.socket?.remoteAddress ??
			req.ip
		operation.client = req.headers["user-agent"]
	}

	const log = new OperationLog(operation)

	await log.save()

	ipc.invoke("ems", "password:changed", operation)

	return user
}
