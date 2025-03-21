import { Post } from "@db_models"
import { DateTime } from "luxon"
import stage from "./stage"

export default async (post_id, update) => {
	let post = await Post.findById(post_id)

	if (!post) {
		throw new OperationError(404, "Post not found")
	}

	const updateKeys = Object.keys(update)

	updateKeys.forEach((key) => {
		post[key] = update[key]
	})

	post.updated_at = DateTime.local().toISO()

	if (Array.isArray(update.poll_options)) {
		post.poll_options = update.poll_options.map((option) => {
			if (!option.id) {
				option.id = nanoid()
			}

			return option
		})
	}

	await post.save()

	post = post.toObject()

	const result = await stage({
		posts: post,
		for_user_id: post.user_id,
	})

	if (post.visibility === "public") {
		global.websocket.io
			.to("global:posts:realtime")
			.emit(`post.update`, result[0])
		global.websocket.io
			.to("global:posts:realtime")
			.emit(`post.update.${post_id}`, result[0])
	}

	if (post.visibility === "private") {
		const userSocket = await global.websocket.find.socketByUserId(
			post.user_id,
		)

		if (userSocket) {
			userSocket.emit(`post.update`, result[0])
			userSocket.emit(`post.update.${post_id}`, result[0])
		}
	}

	return result[0]
}
