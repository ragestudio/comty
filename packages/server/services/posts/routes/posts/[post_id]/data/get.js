import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		const result = await Posts.data({
			post_id: req.params.post_id,
			for_user_id: req.auth?.session?.user_id,
		})

		return result
	},
}
