import type API from "@services/users/users.service"

import Users from "@classes/users"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const data = await Users.data({
			user_id: req.auth.session.user_id,
		})

		if (!data) {
			throw new OperationError(404, "User not found")
		}

		return data.roles
	},
})
