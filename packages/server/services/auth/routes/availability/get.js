import { User } from "@db_models"

export default async (req) => {
	const { username, email } = req.query

	if (!username && !email) {
		throw new OperationError(400, "Missing username or email")
	}

	let query = {
		username: username,
	}

	if (email) {
		query = {
			email: email,
		}
	}

	const user = await User.findOne(query).catch((error) => {
		return false
	})

	if (user) {
		return {
			message: "User already exists",
			exists: true,
		}
	} else {
		return {
			message: "User doesn't exists",
			exists: false,
		}
	}
}
