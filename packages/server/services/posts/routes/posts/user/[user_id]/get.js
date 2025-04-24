import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		return await Posts.fromUserId({
			skip: req.query.skip,
			trim: req.query.trim,
			user_id: req.params.user_id,
			for_user_id: req.auth?.session?.user_id,
		})
	},
}
