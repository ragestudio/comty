import bcrypt from "bcrypt"
import { User } from "@db_models"

export default async ({ username, password, hash }, user) => {
    if (typeof user === "undefined") {
        let isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

        let query = isEmail ? { email: username } : { username: username }

        user = await User.findOne(query).select("+email").select("+password")
    }

	if (!user) {
		throw new OperationError(401, "User not found")
	}

	if (user.disabled == true) {
		throw new OperationError(401, "User is disabled")
	}

    if (typeof hash !== "undefined") {
        if (user.password !== hash) {
            throw new OperationError(401, "Invalid credentials")
        }
    } else {
        if (!bcrypt.compareSync(password, user.password)) {
            throw new OperationError(401, "Invalid credentials")
        }
    }

    return user
}