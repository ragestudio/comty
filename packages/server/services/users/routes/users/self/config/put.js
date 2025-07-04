import { UserConfig } from "@db_models"
import lodash from "lodash"

const baseConfig = [
	{
		key: "app:language",
		type: "string",
		value: "en-us",
	},
	{
		key: "auth:mfa",
		type: "boolean",
		value: false,
	},
]

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		let config = await UserConfig.findOne({
			user_id: req.auth.session.user_id,
		})

		const values = {}

		baseConfig.forEach((config) => {
			const fromBody = req.body[config.key]
			if (typeof fromBody !== "undefined") {
				if (typeof fromBody === config.type) {
					values[config.key] = req.body[config.key]
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

			config = await UserConfig.updateOne(
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
}
