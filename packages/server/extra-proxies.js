export default {
	"/spectrum/*": {
		target: process.env.SPECTRUM_API ?? "https://live.ragestudio.net",
		pathRewrite: { "^/spectrum/(.*)": "/$1", "^/spectrum": "/" },
		websocket: true,
	},
}
