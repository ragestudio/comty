import type API from "@services/users/users.service"

import UserConfig from "@db_models/userConfig"
import lodash from "lodash"

const baseConfig = [
	{
		key: "app:language",
		type: "string",
		value: "en-us",
	},
	{
		key: "auth:2fa-type",
		type: "string",
		value: "none",
	},
]

type RouteBody = Record<string, unknown>

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const body = (req.body ?? {}) as RouteBody

		let config = await UserConfig.findOne({
			user_id: req.auth.session.user_id,
		})

		const values: Record<string, unknown> = {}

		baseConfig.forEach((config) => {
			const fromBody = body[config.key]

			if (typeof fromBody !== "undefined") {
				if (typeof fromBody === config.type) {
					values[config.key] = body[config.key]
				} else {
					throw new OperationError(
						400,
						`Invalid type for ${config.key}`,
					)
				}
			} else {
				values[config.key] = config.value
			}
		})

		if (!config) {
			config = await UserConfig.create({
				user_id: req.auth.session.user_id,
				values,
			})
		} else {
			const newValues = lodash.merge(config.values, values)

			await UserConfig.updateOne(
				{
					user_id: req.auth.session.user_id,
				},
				{
					values: newValues,
				},
			)

			config = await UserConfig.findOne({
				user_id: req.auth.session.user_id,
			})
		}

		return config.values
	},
})
