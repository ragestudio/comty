import type { ChatConfig } from "@/chat/types"

import ChatsModel from "@comty/api-lib/models/chats"

const config: ChatConfig = {
	events: {
		message: "channel:message",
		messageUpdated: "channel:message:updated",
		messageDeleted: "channel:message:deleted",
		typing: "channel:typing",
	},
	methods: {
		send: "channel:send",
		subscribe: "channel:subscribe",
		unsubscribe: "channel:unsubscribe",
		typing: "channel:typing",
	},
	model: {
		get: (params, options) =>
			ChatsModel.channels.messages.get(
				params.group_id,
				params.channel_id,
				options,
			),
	},
	params: {
		send: (params, data) => ({
			group_id: params.group_id,
			channel_id: params.channel_id,
			...data,
		}),
		subscribe: (params) => ({
			group_id: params.group_id,
			channel_id: params.channel_id,
		}),
		unsubscribe: (params) => ({
			group_id: params.group_id,
			channel_id: params.channel_id,
		}),
		typing: (params, isTyping) => ({
			isTyping,
			group_id: params.group_id,
			channel_id: params.channel_id,
		}),
	},
}

export default config
