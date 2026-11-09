import Main from "./main.js"

new Main().initialize().catch((error) => {
	console.error("[app] failed to initialize:", error)
})
