import User from "@db_models/user"
import defaultAvatar from "@shared-utils/defaultAvatar"

export default async (user_id, update) => {
	if (typeof user_id === "undefined") {
		throw new Error("No user_id provided")
	}

	if (typeof update === "undefined") {
		throw new Error("No update provided")
	}

	let user = await User.findById(user_id)

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	const updateKeys = Object.keys(update)

	updateKeys.forEach((key) => {
		if (key === "avatar" && update[key] === null) {
			update[key] = defaultAvatar(user.username)
		}
		user[key] = update[key]
	})

	await user.save()

	user = user.toObject()

	const userSockets = await global.websockets.find.clientsByUserId(
		user._id.toString(),
	)

	for (const userSocket of userSockets) {
		userSocket.emit(`self:user:update`, user)
	}

	return user
}
