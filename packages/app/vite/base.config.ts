import { defineConfig } from "vite"

import resolveConfig from "./resolve.config"
import pluginsConfig from "./plugins.config"
import serverConfig from "./server.config"
import cssConfig from "./css.config"
import optimizeConfig from "./optimize.config"
import esbuildConfig from "./esbuild.config"
import buildConfig from "./build.config"

export default defineConfig({
	base: "/",
	envPrefix: ["VITE_", "TAURI_ENV_*"],

	plugins: pluginsConfig,
	resolve: resolveConfig,
	server: serverConfig,
	css: cssConfig,
	optimizeDeps: optimizeConfig,
	esbuild: esbuildConfig,
	build: buildConfig,
})
