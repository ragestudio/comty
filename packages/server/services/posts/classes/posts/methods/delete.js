import { Post, PostLike, PostSave } from "@db_models"

export default async (payload = {}) => {
	let { post_id } = payload

	if (!post_id) {
		throw new OperationError(400, "Missing post_id")
	}

	const post = await Post.findById(post_id)

	if (!post) {
		throw new OperationError(404, "Post not found")
	}

	await Post.deleteOne({
		_id: post_id,
	}).catch((err) => {
		throw new OperationError(500, `An error has occurred: ${err.message}`)
	})

	// search for likes
	await PostLike.deleteMany({
		post_id: post_id,
	}).catch((err) => {
		throw new OperationError(500, `An error has occurred: ${err.message}`)
	})

	// deleted from saved
	await PostSave.deleteMany({
		post_id: post_id,
	}).catch((err) => {
		throw new OperationError(500, `An error has occurred: ${err.message}`)
	})

	// delete replies
	await Post.deleteMany({
		reply_to: post_id,
	}).catch((err) => {
		throw new OperationError(500, `An error has occurred: ${err.message}`)
	})

	// broadcast post to all users
	if (post.visibility === "public") {
		global.websockets.senders.toTopic("realtime:feed", "post:delete", {
			_id: post_id,
		})
	}

	if (post.visibility === "private") {
		const userSockets = await global.websockets.find.clientsByUserId(
			post.user_id,
		)

		for (const userSocket of userSockets) {
			userSocket.emit(`post:delete`, {
				_id: post_id,
			})
		}
	}

	return {
		deleted: true,
	}
}
