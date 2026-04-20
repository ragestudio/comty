import db from "../store"
import { Dexie } from "dexie"
import { Message } from "../collections/message"

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
	invalidateCache: (
		messages: Message[],
		beforeId: string,
		afterId: string,
		params: any,
	) => Promise<Boolean>
}

export const groupAdapter: ChatAdapter = {
	storeMessage: async (message: Message) => {
		await db.channel_messages.add(message)
		await db.last_channels_message.put({
			channel_id: message.channel_id,
			_id: message._id,
		})
	},
	deleteMessage: async (id) => {
		await db.channel_messages.where("_id").equals(id).delete()
	},
	checkMessageExists: async (id) => {
		const msg = await db.channel_messages.where("_id").equals(id).first()
		return !!msg
	},
	getCachedMessages: async (params, limit, beforeId, afterId) => {
		if (beforeId) {
			return db.channel_messages
				.where("[channel_id+_id]")
				.between(
					[params.channel_id, Dexie.minKey],
					[params.channel_id, beforeId],
				)
				.reverse()
				.limit(limit)
				.toArray()
		}

		if (afterId) {
			const msgs = await db.channel_messages
				.where("[channel_id+_id]")
				.between(
					[params.channel_id, afterId],
					[params.channel_id, Dexie.maxKey],
					false,
					true,
				)
				.limit(limit)
				.toArray()
			return msgs.reverse()
		}

		return db.channel_messages
			.where("[channel_id+_id]")
			.between(
				[params.channel_id, Dexie.minKey],
				[params.channel_id, Dexie.maxKey],
			)
			.reverse()
			.limit(limit)
			.toArray()
	},
	cacheMessages: async (messages: Message[]) => {
		if (!Array.isArray(messages)) {
			console.error("Failed to cache messages, messages is not an Array")
			return
		}

		messages = messages.map((msg) => {
			msg.cached_at = Date.now()

			delete msg.user

			return msg
		})

		await db.channel_messages.bulkPut(messages)

		// const lastMessage = messages.at(0)
		// console.log("cacheMessages::lastMessage", lastMessage)

		// if (lastMessage) {
		// 	await db.last_channels_message.put({
		// 		channel_id: lastMessage.channel_id,
		// 		_id: lastMessage._id,
		// 	})
		// }
	},
	invalidateCache: async (
		cache: Message[],
		beforeId: string,
		afterId: string,
		params: any,
	) => {
		if (!params || !params.channel_id) {
			return true
		}

		const lastChannelMessageRef = await db.last_channels_message.get(
			params.channel_id,
		)

		// if no last message ref is stored, invalidate cache
		if (!lastChannelMessageRef) {
			return true
		}

		const oldestItem = cache.at(-1) as Message
		const newestItem = cache.at(0) as Message

		console.log("Checking valid cache", {
			cache,
			beforeId,
			afterId,
			oldestItem,
			newestItem,
			lastChannelMessageRef,
		})

		if (!afterId && !beforeId) {
			if (!newestItem) {
				return true
			}

			if (
				parseInt(newestItem._id) < parseInt(lastChannelMessageRef._id)
			) {
				return true
			}
		}

		// if query is beforeId, check if the newest item in the cache
		// is older than the last channel message,
		// if its, invalidate cache
		if (beforeId) {
			if (!oldestItem) {
				return true
			}

			if (
				parseInt(oldestItem._id) < parseInt(lastChannelMessageRef._id)
			) {
				return true
			}
		}

		// if the oldest message is older than specified afterId, invalidate cache
		// also check if the afterId is minor than the last channel message
		if (afterId) {
			if (parseInt(lastChannelMessageRef._id) >= parseInt(afterId)) {
				return false
			}

			if (!newestItem) {
				return true
			}

			if (parseInt(newestItem._id) < parseInt(afterId)) {
				return true
			}
		}

		return false
	},
}

export const dmAdapter: ChatAdapter = {
	storeMessage: async (message) => {
		await db.direct_messages.put(message).catch(console.error)
	},
	deleteMessage: async (id) => {
		// we use catch because the store schema might not have _id indexed
		try {
			// @ts-ignore
			await db.direct_messages.where("_id").equals(id).delete()
		} catch (e) {
			console.error(e)
		}
	},
	checkMessageExists: async (id) => {
		try {
			// @ts-ignore
			const msg = await db.direct_messages.where("_id").equals(id).first()
			return !!msg
		} catch (e) {
			return false
		}
	},
	getCachedMessages: async (params, limit, beforeId, afterId) => {
		if (beforeId) {
			return db.direct_messages
				.where("[to_user_id+_id]")
				.between(
					[params.to_user_id, Dexie.minKey],
					[params.to_user_id, beforeId],
				)
				.reverse()
				.limit(limit)
				.toArray()
		}
		if (afterId) {
			const msgs = await db.direct_messages
				.where("[to_user_id+_id]")
				.between(
					[params.to_user_id, afterId],
					[params.to_user_id, Dexie.maxKey],
					false,
					true,
				)
				.limit(limit)
				.toArray()
			return msgs.reverse()
		}
		return db.direct_messages
			.where("[to_user_id+_id]")
			.between(
				[params.to_user_id, Dexie.minKey],
				[params.to_user_id, Dexie.maxKey],
			)
			.reverse()
			.limit(limit)
			.toArray()
	},
	cacheMessages: async (messages) => {
		await db.direct_messages.bulkPut(
			messages.map((msg) => ({ ...msg, cached_at: Date.now() })),
		)
	},
	invalidateCache: async (
		messages: Message[],
		beforeId: string,
		afterId: string,
	) => {
		return true
	},
}

export const adapters: Record<string, ChatAdapter> = {
	group: groupAdapter,
	dm: dmAdapter,
}

export const getAdapter = (type: string): ChatAdapter => {
	const adapter = adapters[type]

	if (!adapter) {
		throw new Error(`invalid chat type: ${type}`)
	}

	return adapter
}
