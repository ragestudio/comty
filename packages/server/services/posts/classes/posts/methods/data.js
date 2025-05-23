import { Post } from "@db_models"
import stage from "./stage"

const maxLimit = 300

export default async (payload = {}) => {
	let {
		for_user_id,
		post_id,
		query = {},
		limit = 20,
		page = 0,
		sort = { created_at: -1 },
	} = payload

	// set a hard limit on the number of posts to retrieve, used for pagination
	if (limit > maxLimit) {
		limit = maxLimit
	}

	let posts = []

	if (post_id) {
		try {
			const post = await Post.findById(post_id)

			posts = [post]
		} catch (error) {
			throw new OperationError(404, "Post not found")
		}
	} else {
		posts = await Post.find({ ...query })
			.sort(sort)
			.limit(limit)
			.skip(limit * page)
	}

	// fullfill data
	posts = await stage({
		posts,
		for_user_id,
	})

	// if post_id is specified, return only one post
	if (post_id) {
		if (posts.length === 0) {
			throw new OperationError(404, "Post not found")
		}

		return posts[0]
	}

	return posts
}
