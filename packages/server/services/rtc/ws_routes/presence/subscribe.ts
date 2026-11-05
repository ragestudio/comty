import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

import { resolvePresenceTopics } from "../../utils/presenceTopics"

/**
 * Subscribes the socket to the presence topic of each requested user.
 * One event covers the whole visible list, so a dm view does not pay one
 * round trip per room.
 */
export default defineRoute<API, HandlerKind["ws"]>()({
	fn: async (client: RTCClient, payload) => {
		if (!client.userId) {
			throw new OperationError(401, "Unauthorized")
		}

		const topics = resolvePresenceTopics(payload)

		if (topics.length === 0) {
			return { ok: true, topics: 0 }
		}

		await client.subscribeMany(topics)

		return { ok: true, topics: topics.length }
	},
})
