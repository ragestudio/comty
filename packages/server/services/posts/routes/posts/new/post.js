import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const result = await Posts.create(
			{
				...req.body,
				user_id: req.auth.session.user_id,
			},
			req,
		)

		return result
	},
}
