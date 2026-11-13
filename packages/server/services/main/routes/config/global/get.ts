import type API from "@services/main/main.service"
import Config from "@db_models/config"

export default defineRoute<API>()({
	fn: async () => {
		const globalConfig = await Config.findOne({
			key: "global",
		})

		if (!globalConfig) {
			return {}
		}

		return globalConfig.value
	},
})
