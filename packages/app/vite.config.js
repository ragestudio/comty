import path from "node:path"
import fs from "node:fs"

import aliases from "./aliases"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const backendUri = "https://0.0.0.0:9000"
const oneYearInSeconds = 60 * 60 * 24 * 365
const sslDirPath = path.join(__dirname, ".ssl")

const config = {
	plugins: [react()],
	resolve: {
		alias: aliases,
	},
	server: {
		host: "0.0.0.0",
		port: 8000,
		fs: {
			allow: ["..", "../../"],
		},
		headers: {
			"Strict-Transport-Security": `max-age=${oneYearInSeconds}`,
		},
		proxy: {
			"/api": {
				target: backendUri,
				rewrite: (path) => path.replace(/^\/api/, ""),
				hostRewrite: true,
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
	esbuild: {
		target: "es2022",
	},
}

// if (fs.existsSync(sslDirPath)) {
// 	config.server.https = {
// 		key: path.join(__dirname, ".ssl", "privkey.pem"),
// 		cert: path.join(__dirname, ".ssl", "cert.pem"),
// 	}
// }

export default defineConfig(config)
