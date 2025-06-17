import { Config } from "@db_models"

const defaultLimits = {
	maxFileSizeInMB: 100,
	maxChunkSizeInMB: 10,
	maxPostCharacters: 512,
	maxAccountsPerIp: 3,
	maxTranscodeTasks: 10,
}

export default {
	description: "Set default server limits",
	fn: async () => {
		// check if limits already exists
		const limits = await Config.findOne({ key: "limits" }).catch(() => {
			return false
		})

		if (limits) {
			console.log("Limits already exists, skipping...")
			return true
		}

		// create limits
		await Config.create({
			key: "limits",
			value: defaultLimits,
		})

		console.log("Default limits created successfully! :", {
			defaultLimits: defaultLimits,
		})
	},
	crashOnFail: true,
}
