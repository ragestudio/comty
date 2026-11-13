import type API from "@services/users/users.service"

import Users from "@classes/users"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Users.data({
			user_id: req.auth.session.user_id,
			add: ["email"],
		})
	},
})
