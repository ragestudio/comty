import type API from "@services/posts/posts.service"

export default defineRoute<API, "ws">()({
	fn: (client, topic) => {
		client.subscribe(topic)
	},
})
