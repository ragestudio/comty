import type API from "@services/users/users.service"
import Users from "@classes/users"

type RouteParams = { user_id: string }

// resolve user id from a username (passed from params)
export default defineRoute<API>()({
	fn: async (req) => {
		const { user_id } = req.params as RouteParams

		return await Users.resolveUserId({
			username: user_id,
		})
	},
})
