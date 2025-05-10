import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
	const { user_id, from_user_id, basic = true, add } = payload

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const isMultipleUsers = Array.isArray(user_id)

	let usersData = null

	if (isMultipleUsers) {
		usersData = await User.find({ _id: { $in: user_id } })

		if (!usersData || !usersData.length) {
			return []
		}

		usersData = usersData.map((user) => user.toObject())
	} else {
		let query = User.findOne({ _id: user_id })

		if (Array.isArray(add) && add.length > 0) {
			const fieldsToSelect = add.map((field) => `+${field}`).join(" ")
			query = query.select(fieldsToSelect)
		}

		usersData = await query

		if (!usersData) {
			throw new OperationError(404, "User not found")
		}

		usersData = usersData.toObject()

		usersData = [usersData]
	}

	if (from_user_id && !basic) {
		const targetUserIds = usersData.map((user) => user._id)

		const followingData = await UserFollow.find({
			user_id: from_user_id,
			to: { $in: targetUserIds },
		})

		const followedUserIds = new Set(
			followingData.map((follow) => follow.to.toString()),
		)

		usersData = usersData.map((user) => ({
			...user,
			following: followedUserIds.has(user._id.toString()),
		}))
	}

	return isMultipleUsers ? usersData : usersData[0]
}
