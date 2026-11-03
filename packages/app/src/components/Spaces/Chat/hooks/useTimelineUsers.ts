import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

import React from "react"

import { useUsers } from "@comty/spaces-sdk/users"

export default function useTimelineUsers(timeline: Message[]) {
	const userIds = React.useMemo(() => {
		const ids = new Set<string>()

		for (const message of timeline) {
			if (message.user_id) ids.add(message.user_id)
		}

		return [...ids].sort()
	}, [timeline])

	return useUsers(userIds)
}
