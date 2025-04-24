import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		return await Posts.fromUserId({
			limit: req.query.limit,
			page: req.query.page,
			user_id: req.params.user_id,
			for_user_id: req.auth?.session?.user_id,
		})
	},
}
