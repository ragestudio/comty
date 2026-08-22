import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface SubscribePayload {
	group_id: string
	channel_id: string
}

export default defineRoute<API, "ws">()({
	fn: async (client: RTEClient, payload: SubscribePayload) => {
		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		// TODO: check if channel exists
		// TODO: check if can subscribe (user is in the group of the channel & has permission)

		await client.subscribe(`chats:channel:${payload.channel_id}`)
	},
})
