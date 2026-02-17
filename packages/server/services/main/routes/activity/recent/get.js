import { RecentActivity } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { type } = req.query
		const user_id = req.auth.session.user_id

		const query = {
			user_id: user_id,
		}

		if (type) {
			query.type = type
		}

		const activities = await RecentActivity.find(query)

		return activities
	},
}
