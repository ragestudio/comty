import type API from "@services/users/users.service"

import UserConfig from "@db_models/userConfig"

type RouteQuery = {
	key?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { key } = req.query as RouteQuery

		let config = await UserConfig.findOne({
			user_id: req.auth.session.user_id,
		})

		if (!config) {
			config = await UserConfig.create({
				user_id: req.auth.session.user_id,
				values: {},
			})
		}

		if (key) {
			return config.values?.[key]
		}

		return config.values
	},
})
