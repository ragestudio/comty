import type API from "@services/users/users.service"
import User from "@classes/users"

type RouteParams = { user_id: string }
type RouteBody = { to?: boolean }

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const to = (req.body as RouteBody)?.to

		return await User.toggleFollow({
			user_id,
			from_user_id: req.auth.session.user_id,
			to,
		})
	},
})
