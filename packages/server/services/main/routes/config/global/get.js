import Config from "@db_models/config"

export default async () => {
	const globalConfig = await Config.findOne({
		key: "global",
	})

	if (!globalConfig) {
		return {}
	}

	return globalConfig.value
}
