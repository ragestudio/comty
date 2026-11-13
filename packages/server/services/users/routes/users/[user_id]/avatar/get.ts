import type API from "@services/users/users.service"
import User from "@db_models/user"

type RouteParams = { user_id: string }

export default defineRoute<API>()({
	fn: async (req) => {
		const { user_id } = req.params as RouteParams

		const user = await User.findOne({ _id: user_id })

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		return user.avatar
	},
})
