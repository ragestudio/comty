import type { User } from "@comty/shared/types/user"
import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

import React from "react"

import db from "@comty/spaces-sdk/db"
import useLiveQuery from "@comty/spaces-sdk/db/react"

const EMPTY_USERS: Record<string, User> = {}

export default function useTimelineUsers(timeline: Message[]) {
	const userIds = React.useMemo(() => {
		const ids = new Set<string>()

		for (const message of timeline) {
			if (message.user_id) ids.add(message.user_id)
		}

		return [...ids].sort()
	}, [timeline])

	const userIdsKey = userIds.join(",")

	const users = useLiveQuery(async () => {
		if (userIds.length === 0) return EMPTY_USERS

		const result = await db.users.bulkGet(userIds)
		const map: Record<string, User> = {}

		for (const user of result) {
			if (user) map[user._id] = user
		}

		return map
	}, [userIdsKey])

	return users ?? EMPTY_USERS
}
