import requiredFields from "@shared-utils/requiredFields"
import { DateTime } from "luxon"

import { Post } from "@db_models"
import stage from "./stage"

const visibilityOptions = ["public", "private", "only_mutuals"]

export default async (payload = {}, req) => {
	await requiredFields(["user_id"], payload)

	let {
		user_id,
		message,
		attachments,
		timestamp,
		reply_to,
		poll_options,
		visibility = "public",
	} = payload

	// check if visibility is valid
	if (!visibilityOptions.includes(visibility)) {
		throw new OperationError(400, "Invalid visibility option")
	}

	// check if is a Array and have at least one element
	const isAttachmentArray =
		Array.isArray(attachments) && attachments.length > 0

	if (!isAttachmentArray && !message) {
		throw new OperationError(
			400,
			"Cannot create a post without message or attachments",
		)
	}

	if (isAttachmentArray) {
		// clean empty attachments
		attachments = attachments.filter((attachment) => attachment)

		// fix attachments with url strings if needed
		attachments = attachments.map((attachment) => {
			if (typeof attachment === "string") {
				attachment = {
					url: attachment,
				}
			}

			return attachment
		})
	}

	if (!timestamp) {
		timestamp = DateTime.local().toISO()
	} else {
		timestamp = DateTime.fromISO(timestamp).toISO()
	}

	if (Array.isArray(poll_options)) {
		poll_options = poll_options.map((option) => {
			if (!option.id) {
				option.id = nanoid()
			}

			return option
		})
	}

	let post = new Post({
		created_at: timestamp,
		user_id: typeof user_id === "object" ? user_id.toString() : user_id,
		message: message,
		attachments: attachments ?? [],
		reply_to: reply_to,
		flags: [],
		poll_options: poll_options,
		visibility: visibility.toLocaleLowerCase(),
	})

	await post.save()

	post = post.toObject()

	const result = await stage({
		posts: post,
		for_user_id: user_id,
	})

	// broadcast post to all users
	if (visibility === "public") {
		global.websockets.senders.toTopic(
			"realtime:feed",
			"post:new",
			result[0],
		)
	}

	if (visibility === "private") {
		const userSockets = await global.websockets.find.clientsByUserId(
			post.user_id,
		)

		for (const userSocket of userSockets) {
			userSocket.emit(`post:new`, result[0])
		}
	}

	// TODO: create background jobs (nsfw dectection)
	global.queues.createJob("classify_post_attachments", {
		post_id: post._id.toString(),
		auth_token: req.headers.authorization,
	})

	return post
}
