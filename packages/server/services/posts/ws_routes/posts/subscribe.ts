import type API from "@services/posts/posts.service"

export default defineRoute<API, HandlerKind["ws"]>()({
	fn: (client, topic) => {
		client.subscribe(topic)
	},
})
