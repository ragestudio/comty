import type { SetChatState, GetChatState } from "./context"

import ChatsService from "@models/chats"

import { getAdapter } from "../adapters"
import { cacheUsers } from "../../../helpers/cache"

export const createSync = (set: SetChatState, get: GetChatState) => ({
	sync: async () => {
		const { type, params } = get()
		if (!type || !params) return
		if (type !== "group") return // existing code only syncs groups

		const adapter = getAdapter(type)
		const chatId = params.channel_id

		const syncState = await adapter.getSyncState(chatId)
		const lastId = syncState?.last_message_id
		const lastSyncAt = syncState?.last_synced_at || 0

		try {
			const { logs, newMessages, updatedMessages, users } =
				await ChatsService.channels.sync(
					params.group_id,
					params.channel_id,
					{
						last_synced_at: lastSyncAt,
						last_message_id: lastId,
					},
				)

			for (const log of logs) {
				if (log.type === "message:deleted") {
					await adapter.deleteMessage(log.target_id)
					set((state) => ({
						timeline: state.timeline.filter(
							(m) => m._id !== log.target_id,
						),
					}))
				}
			}

			if (updatedMessages?.length > 0) {
				await adapter.cacheMessages(updatedMessages)
				get().actions.pushToTimeline(updatedMessages, "bottom")
			}

			if (newMessages?.length > 0) {
				if (users) await cacheUsers(users)
				await adapter.cacheMessages(newMessages)
				get().actions.pushToTimeline(newMessages, "bottom")

				const newest = newMessages.sort((a: any, b: any) =>
					b._id.localeCompare(a._id),
				)[0]

				await adapter.updateSyncState({
					chat_id: chatId,
					last_message_id: newest._id,
					last_synced_at: Date.now(),
				})
			} else {
				await adapter.updateSyncState({
					chat_id: chatId,
					last_synced_at: Date.now(),
				})
			}
		} catch (err) {
			console.error("Sync failed", err)
		}
	},
})
