import { useEffect } from "react"

import type { ChatParams, ChatType } from "./types"
import { getChatSessionKey } from "./types"

import { useChatActions } from "./index"
import { subscribeChatSocket } from "@/events"
import logger from "@/utils/logger"

export function useChatSession(type: ChatType, params: ChatParams) {
	const actions = useChatActions()
	const sessionKey = getChatSessionKey(type, params)

	useEffect(() => {
		actions.init(type, params).catch(logger.error)

		const cleanup = subscribeChatSocket(type, params)

		return () => {
			cleanup()
			actions.reset()
		}
	}, [sessionKey])

	return sessionKey
}

export default useChatSession
