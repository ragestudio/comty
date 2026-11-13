import type API from "@services/main/main.service"

export default defineRoute<API>()({
	fn: () => {
		return "I'm sorry, I can't hear you over the sound of me not doing nothing."
	},
})
