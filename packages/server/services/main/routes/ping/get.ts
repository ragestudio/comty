import type API from "@services/main/main.service"

export default defineRoute<API>()({
	fn: (req) => {
		return "pong"
	},
})
