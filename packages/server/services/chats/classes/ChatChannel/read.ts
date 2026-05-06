// @ts-ignore
import { User } from "@db_models"

import MessageModel from "@db/channel_messages"

type ReadQuery = {
	channel_id: string
	$limit: number
	$orderby: {
		_id: "asc" | "desc"
	}
	_id?: {
		$lt?: string
		$gt?: string
	}
}

export default async function (user, payload) {
	const { limit = 50, beforeId, afterId } = payload

	let query: ReadQuery = {
		channel_id: this.channel._id.toString(),
		$limit: limit,
		$orderby: {
			_id: "desc",
		},
	}

	if (beforeId) {
		query._id = {
			$lt: beforeId,
		}
	}

	if (afterId) {
		query._id = {
			$gt: afterId,
		}
	}

	let messages = await MessageModel.find(query, {
		raw: true,
	})
	let users = []

	// fetch user data if there are any messages
	if (messages.length !== 0) {
		users = await User.find({
			_id: {
				$in: messages.map((message) => message.user_id),
			},
		}).select("_id username public_name roles avatar cover bot bot_id")
	}

	if (typeof this.onRead === "function") {
		await this.onRead(user, messages, users)
	}

	return {
		items: messages,
		users: users,
	}
}
