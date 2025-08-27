import bcrypt from "bcrypt"
import { User, PasswordHash } from "@db_models"

export default async ({ username, password }, user) => {
	if (typeof user === "undefined") {
		let isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

		let query = isEmail ? { email: username } : { username: username }

		user = await User.findOne(query).select("+email").select("+password")
	}

	if (!user) {
		throw new OperationError(401, "User not found")
	}

	if (user.disabled === true) {
		throw new OperationError(401, "User is disabled")
	}

	if (user.bot === true) {
		throw new OperationError(401, "Bots cannot login")
	}

	const passwordHash = await PasswordHash.findOne({
		user_id: user._id.toString(),
	})

	if (!passwordHash) {
		throw new OperationError(401, "User not found")
	}

	if (!bcrypt.compareSync(password, passwordHash.hash)) {
		throw new OperationError(401, "Invalid credentials")
	}

	return user
}
