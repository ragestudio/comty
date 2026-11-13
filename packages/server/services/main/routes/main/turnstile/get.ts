import type API from "@services/main/main.service"

export default defineRoute<API>()({
	fn: () => {
		return {
			siteKey: process.env.TURNSTILE_SITEKEY,
		}
	},
})
