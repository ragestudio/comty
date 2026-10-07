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
		send: "dm:send",
		subscribe: "dm:subscribe",
		unsubscribe: "dm:unsubscribe",
		typing: "dm:typing",
	},
	model: {
		get: (params, options) =>
			ChatsModel.dm.messages.get(params.to_user_id, options),
	},
	params: {
		send: (params, data) => ({
			to_user_id: params.to_user_id,
			...data,
		}),
		subscribe: (params) => ({
			to_user_id: params.to_user_id,
		}),
		unsubscribe: (params) => ({
			to_user_id: params.to_user_id,
		}),
		typing: (params, isTyping) => ({
			isTyping,
			to_user_id: params.to_user_id,
		}),
	},
}

export default config
