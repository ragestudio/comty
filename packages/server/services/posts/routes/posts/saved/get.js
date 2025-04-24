import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Posts.getSaved({
			trim: req.query.trim,
			limit: req.query.limit,
			user_id: req.auth.session.user_id,
		})
	},
}
