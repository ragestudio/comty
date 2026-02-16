import { Config } from "@db_models"

export default async () => {
	const globalConfig = await Config.findOne({
		key: "global",
	})

	if (!globalConfig) {
		return {}
	}

	return globalConfig.value
}
