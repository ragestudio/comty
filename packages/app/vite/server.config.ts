import type { UserConfig } from "vite"

export default {
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
} satisfies UserConfig["server"]
