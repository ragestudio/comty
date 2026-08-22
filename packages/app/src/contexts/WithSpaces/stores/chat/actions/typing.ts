import type { SetChatState, GetChatState } from "./context"

import { CHAT_CONFIGS, getSocket } from "../constants"
import { internalState as mutableState } from "../internalState"

export const createTyping = (set: SetChatState, get: GetChatState) => ({
	typing: (isTypingNow = true) => {
		const { type, params } = get()
		if (!type || !params) return

		const config = CHAT_CONFIGS[type]
		set({ isTyping: isTypingNow })

		if (mutableState.typingTimeout) clearTimeout(mutableState.typingTimeout)

		if (mutableState.isTypingNetworkState !== isTypingNow) {
			mutableState.isTypingNetworkState = isTypingNow
			const socket = getSocket()
			if (socket) {
				socket
					.call(
						config.methods.typing,
						config.params.typing(params, isTypingNow),
					)
					.catch((err: any) =>
						console.error("error setting typing state:", err),
					)
			}
		}

		if (isTypingNow) {
			mutableState.typingTimeout = setTimeout(
				() => get().actions.typing(false),
				5000,
			)
		}
	},
})
