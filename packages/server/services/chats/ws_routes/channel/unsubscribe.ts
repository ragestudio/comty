import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface UnsubscribePayload {
	channel_id: string
}

export default defineRoute<API, "ws">()({
	fn: async (client: RTEClient, payload: UnsubscribePayload) => {
		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		await client.unsubscribe(`chats:channel:${payload.channel_id}`)
	},
})
