import { Post } from "@db_models"
import stage from "@classes/posts/methods/stage"

export default {
	middlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const { limit, trim } = req.query

		let result = await Post.find({
			message: {
				$regex: new RegExp(`#${req.params.trending}`, "gi"),
			},
		})
			.sort({ created_at: -1 })
			.skip(trim ?? 0)
			.limit(limit ?? 20)

		result = await stage({
			posts: result,
			for_user_id: req.auth.session.user_id,
		})

		return result
	},
}
