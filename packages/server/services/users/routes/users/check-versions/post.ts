import type API from "@services/users/users.service"
import User from "@db_models/user"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_ids } = req.body || {}

		if (!Array.isArray(user_ids) || user_ids.length === 0) {
			return {}
		}

		// cap to prevent abuse
		const ids = user_ids.slice(0, 500)

		const users = await User.find(
			{ _id: { $in: ids } },
			{ _id: 1, __v: 1 },
		).lean()

		const versions: Record<string, number> = {}

		for (const user of users) {
			versions[String(user._id)] = user.__v ?? 0
		}

		return versions
	},
})
