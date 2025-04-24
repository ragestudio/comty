import Posts from "@classes/posts"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req, res) => {
		const payload = {
			limit: req.query?.limit,
			page: req.query?.page,
		}

		if (req.auth) {
			payload.for_user_id = req.auth.session.user_id
		}

		const result = await Posts.timeline(payload)

		return result
	},
}
