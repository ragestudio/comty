import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"
import type { Message } from "@comty/shared/types/spaces/message"

// Placeholder payload since we haven't strictly defined InboundEvents yet
interface SendPayload extends Partial<Message> {
	group_id: string
	channel_id: string
}

export default defineRoute<API, "ws">()({
	useContexts: ["groupChannels"] as const,
	fn: async (client: RTEClient, payload: SendPayload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!payload.channel_id) {
			throw new OperationError(400, "Missing channel_id")
		}

		const channel = await ctx.groupChannels.get(
			payload.group_id,
			payload.channel_id,
			client.userId,
		)

		await channel.write((client as any).user ?? client.socket.context.user, payload)
	},
})
