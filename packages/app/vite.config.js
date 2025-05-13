import path from "node:path"
import fs from "node:fs"

import aliases from "./aliases"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const sslDirPath = path.resolve(__dirname, "../../", ".ssl")

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
			"Strict-Transport-Security": `max-age=31536000`,
		},
		proxy: {
			"/api": {
				target: "http://0.0.0.0:9000",
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

if (fs.existsSync(sslDirPath)) {
	const keyPath = path.join(sslDirPath, "privkey.pem")
	const certPath = path.join(sslDirPath, "cert.pem")

	if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
		console.info(`Starting server on SSL mode > [${sslDirPath}]`)

		config.server.proxy["/api"].target = "https://0.0.0.0:9000"
		config.server.https = {
			key: keyPath,
			cert: certPath,
		}
	} else {
		console.error(
			`SSL path finded, but some files are missing. Disabling ssl mode.\nRequired files:\n\t${keyPath}\n\t${certPath}`,
		)
	}
}

export default defineConfig(config)
