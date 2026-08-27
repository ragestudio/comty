import type { UserConfig } from "vite"

export default {
	include: ["src/cores/**/*.core.js", "src/cores/**/*.core.ts"],
	exclude: ["vessel", "comty.js", "linebridge-client"],
} satisfies UserConfig["optimizeDeps"]
