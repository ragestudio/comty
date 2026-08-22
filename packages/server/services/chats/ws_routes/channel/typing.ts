import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface TypingPayload {
	group_id: string
	channel_id: string
	isTyping: boolean
}

export default defineRoute<API, "ws">()({
	useContexts: ["groupChannels"] as const,
	fn: async (client: RTEClient, payload: TypingPayload, ctx) => {
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

		const userData = (client as any).user ?? client.socket.context.user

		await channel.sendEventToChannelTopic("channel:typing", {
			user_id: client.userId,
			user: {
				_id: userData._id,
				username: userData.username,
				avatar: userData.avatar,
			},
			group_id: channel.channel.group_id.toString(),
			channel_id: channel.channel._id.toString(),
			isTyping: payload.isTyping,
		})

		return true
	},
})
