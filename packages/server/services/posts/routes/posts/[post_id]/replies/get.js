import PostClass from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		return await PostClass.replies({
			post_id: req.params.post_id,
			for_user_id: req.auth?.session.user_id,
			page: req.query.page,
			limit: req.query.limit,
		})
	},
}
