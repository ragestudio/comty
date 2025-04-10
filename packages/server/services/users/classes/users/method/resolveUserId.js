import { User } from "@db_models"

export default async (payload = {}) => {
	const { username } = payload

	if (!username) {
		throw new OperationError(400, "Missing username")
	}

	let user = await User.findOne({
		username,
	}).catch((err) => {
		return false
	})

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	return {
		user_id: user._id.toString(),
	}
}
