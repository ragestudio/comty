import type { UserConfig } from "vite"

import react from "@vitejs/plugin-react-swc"

export const mutateSwcOptions = (options: any) => {
	options.jsc = options.jsc || {}
	options.jsc.transform = options.jsc.transform || {}
	options.jsc.parser = options.jsc.parser || {}

	// force native decorators
	options.jsc.transform.decoratorVersion = "2022-03"
}

export const parserConfig = (id: string) => {
	if (id.includes("comty.js")) {
		if (id.endsWith(".tsx"))
			return { syntax: "typescript", tsx: true, decorators: true }
		if (id.endsWith(".ts"))
			return { syntax: "typescript", tsx: false, decorators: true }
		return undefined
	}

	if (id.endsWith(".tsx"))
		return { syntax: "typescript", tsx: true, decorators: true }
	if (id.endsWith(".ts"))
		return { syntax: "typescript", tsx: false, decorators: true }
	if (id.endsWith(".jsx")) return { syntax: "ecmascript", jsx: true }
	if (id.endsWith(".mdx")) return { syntax: "ecmascript", jsx: true }

	return undefined
}

export default [
	react({
		devTarget: "es2024",
		disableOxcRecommendation: false,
		useAtYourOwnRisk_mutateSwcOptions: mutateSwcOptions,
		// @ts-expect-error
		parserConfig: parserConfig,
	}),
] satisfies UserConfig["plugins"]
