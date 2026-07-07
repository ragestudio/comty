import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

import aliases from "./aliases"

export default defineConfig({
	base: "/",
	plugins: [
		react({
			disableOxcRecommendation: false,
		}),
	],
	resolve: {
		alias: aliases,
		mainFields: ["browser", "module", "main"],
	},
	envPrefix: ["VITE_", "TAURI_ENV_*"],
	server: {
		host: "0.0.0.0",
		port: 8000,
		fs: {
			allow: ["..", "../../"],
		},
		headers: {
			"Strict-Transport-Security": `max-age=31536000`,
			"Access-Control-Allow-Origin": "*",
		},
		proxy: {
			"/api": {
				target: "http://0.0.0.0:9000",
				rewrite: (path) => path.replace(/^\/api/, ""),
				changeOrigin: true,
				xfwd: true,
				ws: true,
				toProxy: true,
				secure: false,
			},
		},
		allowedHosts: ["indev.comty.app"],
	},
	css: {
		preprocessorOptions: {
			less: {
				javascriptEnabled: true,
			},
		},
	},

	optimizeDeps: {
		include: ["src/cores/**/*.core.js", "src/cores/**/*.core.ts"],
		exclude: ["vessel", "comty.js", "linebridge-client"],
	},

	build: {
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
	},
})
