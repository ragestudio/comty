import type API from "@services/users/users.service"
import Users from "@classes/users"

export default defineRoute<API>()({
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const user_id = req.auth?.session?.user_id

		if (!user_id) {
			throw new OperationError(401, "Unauthorized")
		}

		const data = await Users.data({
			user_id,
		})

		return data.roles
	},
})
