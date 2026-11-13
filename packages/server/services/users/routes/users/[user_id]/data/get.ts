import type API from "@services/users/users.service"
import Users from "@classes/users"

type RouteParams = { user_id: string }
type RouteQuery = { basic?: string | boolean }

export default defineRoute<API>()({
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const { basic } = req.query as RouteQuery

		const ids = user_id.split(",")

		return await Users.data({
			user_id: ids.length > 1 ? ids : user_id,
			from_user_id: req.auth?.user_id,
			basic: ToBoolean(basic),
		})
	},
})
