import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

import { resolvePresenceTopics } from "../../utils/presenceTopics"

/** Removes the presence topic subscriptions of the given users */
export default defineRoute<API, HandlerKind["ws"]>()({
	fn: async (client: RTCClient, payload) => {
		if (!client.userId) {
			throw new OperationError(401, "Unauthorized")
		}

		const topics = resolvePresenceTopics(payload)

		if (topics.length === 0) {
			return { ok: true, topics: 0 }
		}

		await client.unsubscribeMany(topics)

		return { ok: true, topics: topics.length }
	},
})
