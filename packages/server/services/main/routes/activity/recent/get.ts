import type API from "@services/main/main.service"
import RecentActivity from "@db_models/recentActivity"

type RouteQuery = {
	type?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { type } = req.query as RouteQuery
		const user_id = req.auth.session.user_id

		const query: Record<string, any> = {
			user_id: user_id,
		}

		if (type) {
			query.type = type
		}

		const activities = await RecentActivity.find(query)

		return activities
	},
})
