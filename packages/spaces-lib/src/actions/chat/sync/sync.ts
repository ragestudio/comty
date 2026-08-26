import type SyncActions from "./index"

import ChatsService from "@models/chats"

export default async function (this: SyncActions): Promise<void> {
	const { type, params } = this.getState()

	if (!type || !params) return
	if (type !== "group") return

	const chatId = params.channel_id

	const syncState = await this.adapter.getSyncState(chatId)
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
				await this.adapter.deleteMessage(log.target_id)

				this.setState((state) => ({
					timeline: state.timeline.filter(
						(m) => m._id !== log.target_id,
					),
				}))
			}
		}

		if (updatedMessages?.length > 0) {
			await this.adapter.cacheMessages(updatedMessages)
			this.state.actions.pushToTimeline(updatedMessages, "bottom")
		}

		if (newMessages?.length > 0) {
			if (users) await this.cache.cacheUsers(users)

			await this.adapter.cacheMessages(newMessages)
			this.state.actions.pushToTimeline(newMessages, "bottom")

			const newest = newMessages.sort((a: any, b: any) =>
				b._id.localeCompare(a._id),
			)[0]

			await this.adapter.updateSyncState({
				chat_id: chatId,
				last_message_id: newest._id,
				last_synced_at: Date.now(),
			})
		} else {
			await this.adapter.updateSyncState({
				chat_id: chatId,
				last_synced_at: Date.now(),
			})
		}
	} catch (err) {
		console.error("Sync failed", err)
	}
}
