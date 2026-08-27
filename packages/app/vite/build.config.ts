import type { UserConfig } from "vite"

export default {
	rollupOptions: {
		output: {
			manualChunks: (id) => {
				if (id.includes("pnpm")) {
					let mod = id.split("pnpm/")[1].split("/")[0]

					if (mod.includes("@")) {
						return mod.split("@")[0]
					}

					return mod
				}

				return null
			},
		},
	},
} satisfies UserConfig["build"]
