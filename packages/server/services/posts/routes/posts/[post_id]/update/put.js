import PostClass from "@classes/posts"
import { Post } from "@db_models"

const AllowedFields = [
	"message",
	"tags",
	"attachments",
	"poll_options",
	"visibility",
]

// TODO: Get limits from LimitsAPI
const MaxStringsLengths = {
	message: 2000,
}

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		let update = {}

		const post = await Post.findById(req.params.post_id)

		if (!post) {
			throw new OperationError(404, "Post not found")
		}

		if (post.user_id !== req.auth.session.user_id) {
			throw new OperationError(403, "You cannot edit this post")
		}

		AllowedFields.forEach((key) => {
			if (typeof req.body[key] !== "undefined") {
				// check maximung strings length
				if (
					typeof req.body[key] === "string" &&
					MaxStringsLengths[key]
				) {
					if (req.body[key].length > MaxStringsLengths[key]) {
						// create a substring
						update[key] = req.body[key].substring(
							0,
							MaxStringsLengths[key],
						)
					} else {
						update[key] = req.body[key]
					}
				} else {
					update[key] = req.body[key]
				}
			}
		})

		return await PostClass.update(req.params.post_id, update)
	},
}
