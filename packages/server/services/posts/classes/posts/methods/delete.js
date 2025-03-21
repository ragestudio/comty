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

	if (post.visibility === "public") {
		global.websocket.io
			.to("global:posts:realtime")
			.emit(`post.delete`, post)
		global.websocket.io
			.to("global:posts:realtime")
			.emit(`post.delete.${post_id}`, post)
	}

	if (post.visibility === "private") {
		const userSocket = await global.websocket.find.socketByUserId(
			post.user_id,
		)
		if (userSocket) {
			userSocket.emit(`post.delete`, post_id)
			userSocket.emit(`post.delete.${post_id}`, post_id)
		}
	}

	return {
		deleted: true,
	}
}
