import { User } from "@db_models"

export default async (req) => {
	const { user_id } = req.params

	const user = await User.findOne({ _id: user_id })

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	return user.avatar
}
