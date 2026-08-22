import type API from "@services/chats/chats.service"
import type { RTEClient } from "linebridge"

interface DMTypingPayload {
	to_user_id: string
	isTyping: boolean
}

export default defineRoute<API, "ws">()({
	useContexts: ["dmChannels"] as const,
	fn: async (client: RTEClient, payload: DMTypingPayload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.to_user_id) {
			throw new OperationError(400, "Missing to_user_id")
		}

		const from_user_id = client.userId
		const to_user_id = payload.to_user_id

		const room = await ctx.dmChannels.get(from_user_id, to_user_id)

		const userData = (client as any).user ?? client.socket.context.user

		await room.sendEventToChannelTopic("channel:typing", {
			user_id: client.userId,
			user: {
				_id: userData._id,
				username: userData.username,
				avatar: userData.avatar,
			},
			channel_id: room._id,
			isTyping: payload.isTyping,
		})

		return true
	},
})
