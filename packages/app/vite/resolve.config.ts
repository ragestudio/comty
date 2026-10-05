import type { UserConfig } from "vite"

import path from "path"

const root = path.resolve(__dirname, "..")
const src = path.join(root, "src")

const modulesPath = path.join(root, "../../", "modules")
const packagesPath = path.join(root, "../../", "packages")

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

		"@comty/spaces-lib": path.join(packagesPath, "spaces-lib/src"),
		"@ragestudio/vessel": path.join(modulesPath, "vessel/src"),
		"@models": path.join(modulesPath, "comty.js/src/models"),
		"comty.js": path.join(modulesPath, "comty.js/src"),
	},
	mainFields: ["browser", "module", "main"],
} satisfies UserConfig["resolve"]
