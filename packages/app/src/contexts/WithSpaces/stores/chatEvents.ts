import { useSpacesChatStore } from "./useSpacesChatStore"

import GROUP_CONFIG from "./chat/configs/group"
import DM_CONFIG from "./chat/configs/dm"

const CHAT_CONFIGS: Record<string, any> = {
	group: GROUP_CONFIG,
	dm: DM_CONFIG,
}

const getSocket = () =>
	(globalThis as any).__comty_shared_state?.ws?.sockets?.get("main") ??
	(globalThis as any).app?.cores?.api?.socket?.() ??
	null

export function subscribeChatSocket(
	type: "group" | "dm",
	params: any,
	events?: { onNewMessage?: (data: any) => void },
) {
	const socket = getSocket()
	const config = CHAT_CONFIGS[type]

	if (!socket || !config) {
		console.warn("Chat websocket not available or invalid config")
		return () => {}
	}

	const subscribeParams = config.params.subscribe(params)
	const actions = useSpacesChatStore.getState().actions

	const handleNewMessage = (data: any) => {
		actions.handleNewMessage(data)
		if (events?.onNewMessage) events.onNewMessage(data)
	}
	const handleMessageUpdated = (data: any) =>
		actions.handleMessageUpdated(data)
	const handleMessageDeleted = (data: any) =>
		actions.handleMessageDeleted(data)
	const handleTypingEvent = (data: any) => actions.handleTypingEvent(data)

	socket.on(config.events.message, handleNewMessage)
	socket.on(config.events.messageUpdated, handleMessageUpdated)
	socket.on(config.events.messageDeleted, handleMessageDeleted)
	socket.on(config.events.typing, handleTypingEvent)

	socket.topics
		.subscribe(config.methods.subscribe, subscribeParams)
		.catch(console.error)

	return () => {
		socket.off(config.events.message, handleNewMessage)
		socket.off(config.events.messageUpdated, handleMessageUpdated)
		socket.off(config.events.messageDeleted, handleMessageDeleted)
		socket.off(config.events.typing, handleTypingEvent)

		socket.topics
			.unsubscribe(config.methods.unsubscribe, subscribeParams)
			.catch(console.error)
	}
}
