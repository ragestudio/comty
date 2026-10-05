import type { UserConfig } from "vite"

import path from "path"

const root = path.resolve(__dirname, "..")
const src = path.join(root, "src")

const modulesPath = path.join(root, "../../", "modules")

export default {
	alias: {
		"@": src,
		"@config": path.join(root, "config"),

		"@cores": path.join(src, "cores"),
		"@pages": path.join(src, "pages"),
		"@styles": path.join(src, "styles"),
		"@components": path.join(src, "components"),
		"@contexts": path.join(src, "contexts"),
		"@utils": path.join(src, "utils"),
		"@layouts": path.join(src, "layouts"),
		"@hooks": path.join(src, "hooks"),
		"@classes": path.join(src, "classes"),
		"@ui": path.join(src, "ui"),

		"@comty/spaces-lib": path.join(
			root,
			"../../",
			"packages",
			"spaces-lib",
			"src",
		),
		"@models": path.join(modulesPath, "comty.js/src/models"),
		"comty.js": path.join(modulesPath, "comty.js", "src"),
		"@ragestudio/vessel": path.join(modulesPath, "vessel", "src"),
		"linebridge-client": path.join(
			modulesPath,
			"linebridge",
			"client",
			"src",
		),
	},
	mainFields: ["browser", "module", "main"],
} satisfies UserConfig["resolve"]
