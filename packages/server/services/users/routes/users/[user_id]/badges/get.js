import { User, Badge } from "@db_models"

export default {
	fn: async (req) => {
		const { user_id } = req.params

		const user = await User.findOne({
			_id: user_id,
		}).catch((err) => {
			return false
		})

		const badges = await Badge.find({
			name: {
				$in: user.badges,
			},
		})

		return badges
	},
}
