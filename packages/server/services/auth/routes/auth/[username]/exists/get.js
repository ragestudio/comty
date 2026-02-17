import { User } from "@db_models"

const emailRegex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)

export default async (req) => {
	const { username } = req.params

	const query = {
		username,
	}

	if (emailRegex.test(username)) {
		delete query.username
		query.email = username
	}

	return {
		exists: !!(await User.exists(query)),
	}
}
