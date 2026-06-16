import db from "../store"
import { Dexie } from "dexie"
import { ExtendedMessage as Message, ChatSyncState } from "./types"

export interface ChatAdapter {
	storeMessage: (message: Message) => Promise<void>
	deleteMessage: (id: string) => Promise<void>
	checkMessageExists: (id: string) => Promise<boolean>
	getCachedMessages: (
		params: any,
		limit: number,
		beforeId?: string,
		afterId?: string,
	) => Promise<Message[]>
	cacheMessages: (messages: Message[]) => Promise<void>
	getSyncState: (chatId: string) => Promise<ChatSyncState | undefined>
	updateSyncState: (
		state: Partial<ChatSyncState> & { chat_id: string },
	) => Promise<void>
}

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
				.between(
					[channelId, Dexie.minKey],
					[channelId, beforeId],
					false,
					false,
				)
				.reverse()
				.limit(limit)
				.toArray()
		}

		if (afterId) {
			return collection
				.between(
					[channelId, afterId],
					[channelId, Dexie.maxKey],
					false,
					false,
				)
				.limit(limit)
				.toArray()
				.then((msgs) => msgs.reverse())
		}

		return collection
			.between([channelId, Dexie.minKey], [channelId, Dexie.maxKey])
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
			last_message_id:
				state.last_message_id ?? current?.last_message_id ?? "",
			has_more_before:
				state.has_more_before ?? current?.has_more_before ?? true,
			has_more_after:
				state.has_more_after ?? current?.has_more_after ?? false,
		})
	},
}

export const dmAdapter: ChatAdapter = {
	storeMessage: async (message) => {
		await db.direct_messages.put(message)
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
				.between(
					[toUserId, Dexie.minKey],
					[toUserId, beforeId],
					false,
					false,
				)
				.reverse()
				.limit(limit)
				.toArray()
		}

		if (afterId) {
			return collection
				.between(
					[toUserId, afterId],
					[toUserId, Dexie.maxKey],
					false,
					false,
				)
				.limit(limit)
				.toArray()
				.then((msgs) => msgs.reverse())
		}

		return collection
			.between([toUserId, Dexie.minKey], [toUserId, Dexie.maxKey])
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
			last_message_id:
				state.last_message_id ?? current?.last_message_id ?? "",
			has_more_before:
				state.has_more_before ?? current?.has_more_before ?? true,
			has_more_after:
				state.has_more_after ?? current?.has_more_after ?? false,
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
