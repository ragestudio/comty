import User from "@db_models/user"
import Badge from "@db_models/badge"

export default {
	fn: async (req) => {
		const { user_id } = req.params
		const { limit, offset } = req.query

		const user = await User.findOne({
			_id: user_id,
		}).lean()

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		if (!user.profile_badges?.length) {
			return []
		}

		const badges = await Badge.find({
			_id: { $in: user.profile_badges },
			enabled: { $ne: false },
		})
			.limit(limit)
			.skip(offset)
			.lean()

		const badgesById = new Map(
			badges.map((badge) => [String(badge._id), badge]),
		)

		return user.profile_badges
			.map((badgeId) => badgesById.get(String(badgeId)))
			.filter(Boolean)
	},
}
