import User from "@db_models/user"
import UserFollow from "@db_models/userFollow"

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

export type GetUserData = {
	user_id: string | string[]
	from_user_id?: string
	basic?: boolean
	add?: string[]
}

export default async (payload: GetUserData) => {
	const { user_id, from_user_id, basic = true, add } = payload ?? {}

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const requestedIds = (Array.isArray(user_id) ? user_id : [user_id])
		.map((id) => (typeof id === "string" ? id.trim() : ""))
		.filter(Boolean)

	if (requestedIds.length === 0) {
		throw new OperationError(400, "Missing user_id")
	}

	// system messages and bots use sentinel ids that are not valid object ids,
	// drop them before hitting the database
	const validIds = requestedIds.filter((id) => OBJECT_ID_REGEX.test(id))

	const isMultipleUsers = requestedIds.length > 1

	if (validIds.length === 0) {
		if (isMultipleUsers) return []

		throw new OperationError(404, "User not found")
	}

	const targetIds = isMultipleUsers ? validIds : validIds[0]

	let usersData = null

	if (Array.isArray(targetIds)) {
		usersData = await User.find({ _id: { $in: targetIds } })

		if (!usersData || !usersData.length) {
			return []
		}

		usersData = usersData.map((user) => user.toObject())
	} else {
		let query = User.findOne({ _id: targetIds })

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
