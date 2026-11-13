import type API from "@services/users/users.service"
import User from "@classes/users"

type RouteParams = { user_id: string }
type RouteQuery = {
	fetchData?: string | boolean
	limit?: string
	page?: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const { fetchData, limit, page } = req.query as RouteQuery

		return await User.getFollowers({
			user_id,
			data: ToBoolean(fetchData),
			limit: parseInt(limit),
			page: parseInt(page),
		})
	},
})
