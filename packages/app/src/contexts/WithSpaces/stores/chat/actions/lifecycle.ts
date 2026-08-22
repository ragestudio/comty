import type { SetChatState, GetChatState } from "./context"

import { CHAT_CONFIGS } from "../constants"
import { getAdapter } from "../adapters"
import sortMessages from "../../../utils/sortMessages"
import { internalState as mutableState } from "../internalState"

export const createLifecycle = (set: SetChatState, get: GetChatState) => ({
	init: async (type: "group" | "dm", params: any): Promise<void> => {
		get().actions.reset()
		const generation = ++mutableState.initGeneration

		const config = CHAT_CONFIGS[type]
		if (!config) throw new Error(`invalid chat type: ${type}`)

		set({ type, params, initialLoading: true })

		const adapter = getAdapter(type)
		const cachedMessages = await adapter.getCachedMessages(params, 50)

		if (generation !== mutableState.initGeneration) return

		if (cachedMessages.length > 0) {
			set({ timeline: sortMessages(cachedMessages) })
		}

		// Trigger background sync
		get().actions.sync().catch(console.error)

		if (cachedMessages.length === 0) {
			await get().actions.load()
		}

		if (generation === mutableState.initGeneration) {
			set({ initialLoading: false })
		}
	},

	reset: () => {
		mutableState.initGeneration++
		mutableState.isTypingNetworkState = false
		if (mutableState.typingTimeout) {
			clearTimeout(mutableState.typingTimeout)
			mutableState.typingTimeout = null
		}

		set({
			type: null,
			params: null,
			initialLoading: true,
			loading: false,
			error: null,
			timeline: [],
			hasMore: true,
			usersTyping: [],
			isTyping: false,
			pausedUpdates: false,
		})
	},

	setPausedUpdates: (paused: boolean) => {
		set({ pausedUpdates: paused })
	},
})
