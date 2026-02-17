import { User, Badge } from "@db_models"

export default {
	fn: async (req) => {
		const { user_id } = req.params
		const { limit, offset } = req.query

		const user = await User.findOne({
			_id: user_id,
		})

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		const badges = await Badge.find({
			name: {
				$in: user.badges,
			},
		})
			.limit(limit)
			.skip(offset)

		return badges
	},
}
