import type { SetChatState, GetChatState } from "./context"

import { CHAT_CONFIGS } from "../constants"
import { getAdapter } from "../adapters"
import { cacheUsers } from "../../../helpers/cache"
import { internalState as mutableState } from "../internalState"
import db from "../../../store"

export const createLoading = (set: SetChatState, get: GetChatState) => ({
	load: async ({ beforeId, afterId, limit = 30 }: any = {}) => {
		const { type, params, loading } = get()
		if (!type || !params || loading) return

		const generation = mutableState.initGeneration
		const config = CHAT_CONFIGS[type]
		const adapter = getAdapter(type)

		set({ loading: true, error: null })

		try {
			const cached = await adapter.getCachedMessages(
				params,
				limit,
				beforeId,
				afterId,
			)

			if (generation !== mutableState.initGeneration) return

			if (cached.length > 0) {
				await db.users
					.where("_id")
					.anyOf(cached.map((m: any) => m.user_id))
					.toArray()
				get().actions.pushToTimeline(cached, afterId ? "top" : "bottom")
			}

			if (cached.length < limit || afterId) {
				const response = await config.model.get(params, {
					limit,
					beforeId,
					afterId,
				})
				if (generation !== mutableState.initGeneration) return

				if (response.items.length > 0) {
					if (response.users) await cacheUsers(response.users)
					await adapter.cacheMessages(response.items)
					get().actions.pushToTimeline(
						response.items,
						afterId ? "top" : "bottom",
					)
				} else if (!afterId) {
					set({ hasMore: false })
				}
			}
		} catch (err: any) {
			if (generation === mutableState.initGeneration) set({ error: err })
		} finally {
			if (generation === mutableState.initGeneration)
				set({ loading: false })
		}
	},

	loadBefore: async (id?: string) => {
		const timeline = get().timeline
		const oldestId = timeline[0]?._id
		if (oldestId) {
			await get().actions.load({ beforeId: id ?? oldestId })
		}
	},

	loadAfter: async (id?: string) => {
		const timeline = get().timeline
		const newestId = timeline[timeline.length - 1]?._id
		if (newestId) {
			await get().actions.load({ afterId: id ?? newestId })
		}
	},

	loadAround: async (messageId: string) => {
		const { type, params, loading } = get()
		if (!type || !params || loading) return

		const generation = mutableState.initGeneration
		const config = CHAT_CONFIGS[type]
		const adapter = getAdapter(type)

		set({ loading: true, error: null })

		try {
			const olderResponse = await config.model.get(params, {
				beforeId: messageId,
				limit: 15,
			})
			const newerResponse = await config.model.get(params, {
				afterId: messageId,
				limit: 15,
			})
			const targetMessage =
				type === "group"
					? await db.channel_messages.get(messageId)
					: await db.direct_messages.get(messageId)

			if (generation !== mutableState.initGeneration) return

			const allMessages = [
				...(olderResponse.items || []),
				...(targetMessage ? [targetMessage] : []),
				...(newerResponse.items || []),
			]

			if (allMessages.length > 0) {
				const users = [
					...(olderResponse.users || []),
					...(newerResponse.users || []),
				]
				if (users.length > 0) await cacheUsers(users)
				await adapter.cacheMessages(allMessages)
				get().actions.pushToTimeline(allMessages, "bottom")
			}
		} catch (err: any) {
			console.error("loadAround failed", err)
		} finally {
			if (generation === mutableState.initGeneration)
				set({ loading: false })
		}
	},
})
