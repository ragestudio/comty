import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface DMUnsubscribePayload {
	to_user_id: string
}

export default defineRoute<API, "ws">()({
	useContexts: ["dmChannels"] as const,
	fn: async (client: RTEClient, payload: DMUnsubscribePayload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.to_user_id) {
			throw new OperationError(400, "Missing to_user_id")
		}

		const from_user_id = client.userId
		const to_user_id = payload.to_user_id

		const room = await ctx.dmChannels.get(from_user_id, to_user_id)

		await client.unsubscribe(`chat:dm:${room._id}`)
	},
})
