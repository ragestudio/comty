import type { SetChatState, GetChatState } from "./context"

import { getAdapter } from "../adapters"
import { cacheUsers } from "../../../helpers/cache"

export const createEvents = (set: SetChatState, get: GetChatState) => ({
	handleNewMessage: (data: any) => {
		const { type, params } = get()
		if (!type || !params) return

		const adapter = getAdapter(type)
		const chatId = type === "group" ? params.channel_id : params.to_user_id

		if (data.user) {
			cacheUsers([data.user]).catch(console.error)
		}

		adapter.storeMessage(data).catch(console.error)
		adapter
			.updateSyncState({ chat_id: chatId, last_message_id: data._id })
			.catch(console.error)

		const pausedUpdates = get().pausedUpdates
		if (!pausedUpdates) {
			get().actions.pushToTimeline([data], "bottom")
		}
	},

	handleMessageDeleted: (data: { _id: string }) => {
		const { type } = get()
		if (!type) return

		const adapter = getAdapter(type)
		adapter.deleteMessage(data._id).catch(console.error)
		set((state) => ({
			timeline: state.timeline.filter((msg) => msg._id !== data._id),
		}))
	},

	handleMessageUpdated: (data: any) => {
		set((state) => ({
			timeline: state.timeline.map((msg) =>
				msg._id === data._id ? { ...msg, ...data } : msg,
			),
		}))
	},

	handleTypingEvent: (data: any) => {
		if (!data) return
		set((state) => {
			const userId = data.user_id || data.user?.id || data.user?._id
			const prev = state.usersTyping

			if (data.isTyping) {
				const isExisting = prev.some(
					(u) => u.id === userId || u._id === userId,
				)
				return isExisting
					? state
					: { usersTyping: [...prev, { id: userId, ...data.user }] }
			}

			return {
				usersTyping: prev.filter(
					(u) => u.id !== userId && u._id !== userId,
				),
			}
		})
	},
})
