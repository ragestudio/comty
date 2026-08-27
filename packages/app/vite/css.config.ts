import type { UserConfig } from "vite"

export default {
	preprocessorOptions: {
		less: {
			javascriptEnabled: true,
		},
	},
} satisfies UserConfig["css"]
