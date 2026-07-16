// @ts-ignore
import ChatsModel from "@models/chats"

export default {
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
			ChatsModel.channels.get(
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
