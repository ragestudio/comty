import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface SubscribePayload {
	group_id: string
	channel_id: string
}

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["groupChannels"] as const,
	fn: async (client: RTEClient, payload: SubscribePayload, ctx) => {
		if (!client.userId) {
			throw new OperationError(401, "Unauthorized")
		}

		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		// validates the channel exists and the viewer can read it
		await ctx.groupChannels.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)

		await client.subscribe(`chats:channel:${payload.channel_id}`)

		return { ok: true }
	},
})
