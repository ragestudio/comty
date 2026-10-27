import type { User } from "@comty/shared/types/user"
import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

import React from "react"

import db from "@comty/spaces-sdk/db"
import useLiveQuery from "@comty/spaces-sdk/db/react"

export interface ReplyData {
	message: Message
	user: User | null
}

const EMPTY_REPLIES: Record<string, ReplyData> = {}

export default function useTimelineReplies(
	timeline: Message[],
	type: "group" | "dm",
) {
	const replyIds = React.useMemo(() => {
		const ids = new Set<string>()

		for (const message of timeline) {
			if (message.reply_to_id) ids.add(message.reply_to_id)
		}

		return [...ids].sort()
	}, [timeline])

	const replyIdsKey = replyIds.join(",")

	const replies = useLiveQuery(async () => {
		if (replyIds.length === 0) return EMPTY_REPLIES

		const table =
			type === "group" ? db.channel_messages : db.direct_messages

		const messages = await table.bulkGet(replyIds)

		const validMessages = messages.filter((message): message is Message =>
			Boolean(message),
		)

		const userIds = [
			...new Set(
				validMessages
					.map((message) => message.user_id)
					.filter((userId): userId is string => Boolean(userId)),
			),
		]

		const users = await db.users.bulkGet(userIds)
		const userMap = new Map<string, User>()

		for (const user of users) {
			if (user) userMap.set(user._id, user)
		}

		const result: Record<string, ReplyData> = {}

		for (const message of validMessages) {
			result[message._id] = {
				message,
				user: message.user_id
					? (userMap.get(message.user_id) ?? null)
					: null,
			}
		}

		return result
	}, [replyIdsKey, type])

	return replies ?? EMPTY_REPLIES
}
