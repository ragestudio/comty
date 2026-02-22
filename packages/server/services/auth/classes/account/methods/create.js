import bcrypt from "bcrypt"
import { User, PasswordHash } from "@db_models"
import Account from "@classes/account"

import requiredFields from "@shared-utils/requiredFields"
import verifyTurnstileToken from "@utils/verifyTurnstileToken"

export default async (payload) => {
	requiredFields(["username", "password", "email"], payload)

	let {
		username,
		password,
		email,
		public_name,
		roles,
		avatar,
		accept_tos,
		captcha,
	} = payload

	if (ToBoolean(accept_tos) !== true) {
		throw new OperationError(
			400,
			"You must accept the terms of service in order to create an account.",
		)
	}

	if (!captcha) {
		throw new OperationError(400, "Captcha token is required")
	}

	const turnstileResponse = await verifyTurnstileToken(captcha)

	if (turnstileResponse.success !== true) {
		throw new OperationError(400, "Invalid captcha token")
	}

	await Account.usernameMeetPolicy(username)

	// check if username is already taken
	const existentUser = await User.findOne({ username: username })

	if (existentUser) {
		throw new OperationError(400, "User already exists")
	}

	// check if the email is already in use
	const existentEmail = await User.findOne({ email: email }).select("+email")

	if (existentEmail) {
		throw new OperationError(400, "Email already in use")
	}

	await Account.passwordMeetPolicy(password)

	// hash the password
	const hash = bcrypt.hashSync(
		password,
		parseInt(process.env.BCRYPT_ROUNDS ?? 3),
	)

	let user = new User({
		username: username,
		email: email,
		public_name: public_name,
		avatar:
			avatar ??
			`https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`,
		roles: roles,
		created_at: new Date().getTime(),
		accept_tos: accept_tos,
		activated: false,
	})

	await user.save()

	await PasswordHash.create({
		user_id: user._id.toString(),
		hash: hash,
	})

	try {
		await Account.sendActivationCode(user._id.toString())
	} catch (error) {
		console.error(error)
	}

	return {
		activation_required: true,
		user: user,
	}
}
