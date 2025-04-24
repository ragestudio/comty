import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		const payload = {
			limit: req.query?.limit,
			trim: req.query?.trim,
		}

		if (req.auth) {
			payload.user_id = req.auth.session.user_id
		}

		const result = await Posts.timeline(payload)

		return result
	},
}
