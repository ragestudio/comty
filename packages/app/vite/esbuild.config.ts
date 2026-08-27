import type { UserConfig } from "vite"

export default {
	target: "es2024",
	tsconfigRaw: {
		compilerOptions: {
			alwaysStrict: false,
			experimentalDecorators: false,
			useDefineForClassFields: true,
		},
	},
} satisfies UserConfig["esbuild"]
