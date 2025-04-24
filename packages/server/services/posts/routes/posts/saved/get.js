import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Posts.getSaved({
			page: req.query.page,
			limit: req.query.limit,
			user_id: req.auth.session.user_id,
		})
	},
}
