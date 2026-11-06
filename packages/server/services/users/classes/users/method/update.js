import User from "@db_models/user"
import defaultAvatar from "@shared-utils/defaultAvatar"
import isUrl from "@shared-utils/isUrl"

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
		user[key] = update[key]
	})

	// validate user avatar, if not valid or empty, set the default
	if (!user.avatar || !isUrl(user.avatar)) {
		user.avatar = defaultAvatar(user.username)
	}

	// validate public_name
	if (typeof user.public_name === "string" && user.public_name.length <= 0) {
		user.public_name = null
	}

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
