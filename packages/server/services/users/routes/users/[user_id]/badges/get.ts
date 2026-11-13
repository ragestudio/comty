import type API from "@services/users/users.service"
import User from "@db_models/user"
import Badge from "@db_models/badge"

type RouteParams = { user_id: string }
type RouteQuery = { limit?: string; offset?: string }

export default defineRoute<API>()({
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const { limit, offset } = req.query as RouteQuery

		const parsedLimit = limit ? Number(limit) : undefined
		const parsedOffset = offset ? Number(offset) : undefined

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
			.limit(parsedLimit)
			.skip(parsedOffset)
			.lean()

		const badgesById = new Map(
			badges.map((badge) => [String(badge._id), badge]),
		)

		return user.profile_badges
			.map((badgeId) => badgesById.get(String(badgeId)))
			.filter(Boolean)
	},
})
