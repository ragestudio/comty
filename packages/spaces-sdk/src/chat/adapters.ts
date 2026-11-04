import type { ExtendedMessage as Message, ChatSyncState } from "./types"

import db from "../db"

export interface ChatAdapter {
	storeMessage: (message: Message, params?: any) => Promise<void>
	deleteMessage: (id: string) => Promise<void>
	checkMessageExists: (id: string) => Promise<boolean>
	getCachedMessages: (
		params: any,
		limit: number,
		beforeId?: string,
		afterId?: string,
	) => Promise<Message[]>
	cacheMessages: (messages: Message[], params?: any) => Promise<void>
	getSyncState: (chatId: string) => Promise<ChatSyncState | undefined>
	updateSyncState: (
		state: Partial<ChatSyncState> & { chat_id: string },
	) => Promise<void>
}

const MaxKey = [[]]
const MinKey = -Infinity

export const groupAdapter: ChatAdapter = {
	storeMessage: async (message: Message) => {
		await db.channel_messages.put(message)
	},
	deleteMessage: async (id) => {
		await db.channel_messages.delete(id)
	},
	checkMessageExists: async (id) => {
		const msg = await db.channel_messages.get(id)
		return !!msg
	},
	getCachedMessages: async (params, limit, beforeId, afterId) => {
		const channelId = params.channel_id
		let collection = db.channel_messages.where("[channel_id+_id]")

		if (beforeId) {
			return collection
				.between([channelId, MinKey], [channelId, beforeId], false, false)
				.reverse()
				.limit(limit)
				.toArray()
		}

		if (afterId) {
			return collection
				.between([channelId, afterId], [channelId, MaxKey], false, false)
				.limit(limit)
				.toArray()
				.then((msgs) => msgs.reverse())
		}

		return collection
			.between([channelId, MinKey], [channelId, MaxKey])
			.reverse()
			.limit(limit)
			.toArray()
	},
	cacheMessages: async (messages: Message[]) => {
		const toStore = messages.map((msg) => ({
			...msg,
			cached_at: Date.now(),
			status: msg.status || "sent",
		}))
		await db.channel_messages.bulkPut(toStore)
	},
	getSyncState: async (chatId) => {
		return db.chats_sync.get(chatId)
	},
	updateSyncState: async (state) => {
		const current = await db.chats_sync.get(state.chat_id)
		await db.chats_sync.put({
			chat_id: state.chat_id,
			last_synced_at:
				state.last_synced_at ?? current?.last_synced_at ?? Date.now(),
			last_message_id: state.last_message_id ?? current?.last_message_id ?? "",
			has_more_before:
				state.has_more_before ?? current?.has_more_before ?? true,
			has_more_after: state.has_more_after ?? current?.has_more_after ?? false,
		})
	},
}

// dm payloads do not carry the peer id, so it has to be taken from the
// active chat params before persisting the message
function tagDirectMessage(message: Message, params?: any): Message {
	const toUserId = params?.to_user_id

	if (!toUserId || message.to_user_id) return message

	return { ...message, to_user_id: toUserId }
}

export const dmAdapter: ChatAdapter = {
	storeMessage: async (message, params) => {
		await db.direct_messages.put(tagDirectMessage(message, params))
	},
	deleteMessage: async (id) => {
		await db.direct_messages.delete(id)
	},
	checkMessageExists: async (id) => {
		const msg = await db.direct_messages.get(id)
		return !!msg
	},
	getCachedMessages: async (params, limit, beforeId, afterId) => {
		const toUserId = params.to_user_id
		let collection = db.direct_messages.where("[to_user_id+_id]")

		if (beforeId) {
			return collection
				.between([toUserId, MinKey], [toUserId, beforeId], false, false)
				.reverse()
				.limit(limit)
				.toArray()
		}

		if (afterId) {
			return collection
				.between([toUserId, afterId], [toUserId, MaxKey], false, false)
				.limit(limit)
				.toArray()
				.then((msgs) => msgs.reverse())
		}

		return collection
			.between([toUserId, MinKey], [toUserId, MaxKey])
			.reverse()
			.limit(limit)
			.toArray()
	},
	cacheMessages: async (messages: Message[], params) => {
		const now = Date.now()
		const toStore = messages.map((msg) => {
			const tagged = tagDirectMessage(msg, params)

			return {
				...tagged,
				cached_at: now,
				status: tagged.status || "sent",
			}
		})
		await db.direct_messages.bulkPut(toStore)
	},
	getSyncState: async (chatId) => {
		return db.chats_sync.get(chatId)
	},
	updateSyncState: async (state) => {
		const current = await db.chats_sync.get(state.chat_id)
		await db.chats_sync.put({
			chat_id: state.chat_id,
			last_synced_at:
				state.last_synced_at ?? current?.last_synced_at ?? Date.now(),
			last_message_id: state.last_message_id ?? current?.last_message_id ?? "",
			has_more_before:
				state.has_more_before ?? current?.has_more_before ?? true,
			has_more_after: state.has_more_after ?? current?.has_more_after ?? false,
		})
	},
}

export const adapters: Record<string, ChatAdapter> = {
	group: groupAdapter,
	dm: dmAdapter,
}

export const getAdapter = (type: string): ChatAdapter => {
	const adapter = adapters[type]
	if (!adapter) throw new Error(`invalid chat type: ${type}`)

	return adapter
}
