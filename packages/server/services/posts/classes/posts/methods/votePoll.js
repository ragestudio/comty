import { VotePoll, Post } from "@db_models"
import stage from "./stage"

// TODO: Implement logic to handle vote poll
export default async (payload = {}) => {
	if (!payload.user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	if (!payload.post_id) {
		throw new OperationError(400, "Missing post_id")
	}

	if (!payload.option_id) {
		throw new OperationError(400, "Missing option_id")
	}

	let post = await Post.findOne({
		_id: payload.post_id,
	})

	if (!post) {
		throw new OperationError(404, "Post not found")
	}

	let vote = await VotePoll.findOne({
		user_id: payload.user_id,
		post_id: payload.post_id,
	})

	let previousOptionId = null

	if (vote) {
		previousOptionId = vote.option_id

		await VotePoll.deleteOne({
			_id: vote._id.toString(),
		})
	}

	vote = new VotePoll({
		user_id: payload.user_id,
		post_id: payload.post_id,
		option_id: payload.option_id,
	})

	await vote.save()

	vote = vote.toObject()

	post = (await stage({ posts: post, for_user_id: payload.user_id }))[0]

	if (post.visibility === "public") {
		global.websockets.senders.toTopic("realtime:feed", `post:update`, post)
	}

	return {
		post: post,
		vote: vote,
	}
}
