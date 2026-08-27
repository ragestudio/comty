import getSocket from "../utils/getSocket"

import { GroupStore } from "./group"
import { ChatStore } from "./chat"
import { GroupsListStore } from "./groupsList"

import GROUP_CONFIG from "./chat/configs/group"
import DM_CONFIG from "./chat/configs/dm"
const CHAT_CONFIGS: Record<string, any> = {
	group: GROUP_CONFIG,
	dm: DM_CONFIG,
}

export function buildGroupSocketEvents(
	groupId: string,
	store: typeof GroupStore,
) {
	const { actions } = store.getState()

	const prefix = `group:${groupId}`

	return {
		// Group
		[`${prefix}:update`]: (payload: any) =>
			actions.handleGroupUpdate(payload),

		// Channels
		[`${prefix}:channel:created`]: (payload: any) =>
			actions.handleChannelCreated(payload),
		[`${prefix}:channel:deleted`]: (payload: any) =>
			actions.handleChannelDeleted(payload),
		[`${prefix}:channel:updated`]: (payload: any) =>
			actions.handleChannelUpdated(payload),
		[`${prefix}:channels:ordered`]: (payload: any) =>
			actions.handleChannelsOrdered(payload),

		// Channel messages
		[`${prefix}:channels:new:message`]: (payload: any) =>
			actions.handleChannelNewMessage(payload),

		// Memberships
		[`${prefix}:membership:created`]: (payload: any) =>
			actions.handleMembershipCreated(payload),
		[`${prefix}:membership:deleted`]: (payload: any) =>
			actions.handleMembershipDeleted(payload),

		// Voice channels
		[`${prefix}:vc:started`]: (payload: any) =>
			actions.handleVoiceChannelStarted(payload),
		[`${prefix}:vc:ended`]: (payload: any) =>
			actions.handleVoiceChannelEnded(payload),
		[`${prefix}:client:vc:join`]: (payload: any) =>
			actions.handleClientVoiceJoin(payload),
		[`${prefix}:client:vc:left`]: (payload: any) =>
			actions.handleClientVoiceLeft(payload),
		[`${prefix}:client:vc:event`]: (payload: any) =>
			actions.handleClientEvent(payload),
		[`${prefix}:client:vc:producer:open`]: (payload: any) =>
			actions.handleProducerOpen(payload),
		[`${prefix}:client:vc:producer:close`]: (payload: any) =>
			actions.handleProducerClose(payload),

		// Presence
		[`${prefix}:user:online`]: (payload: any) =>
			actions.handleUserOnline(payload),
		[`${prefix}:user:offline`]: (payload: any) =>
			actions.handleUserOffline(payload),
	}
}

export function subscribeGroupSocket(groupId: string): () => void {
	const socket = getSocket()

	if (!socket) {
		console.warn(
			"[socket] Socket not available, skipping group subscription",
		)
		return () => {}
	}

	const events = buildGroupSocketEvents(groupId, GroupStore)

	socket.topics.subscribe("group:subscribe", groupId)

	for (const [event, handler] of Object.entries(events)) {
		socket.on(event, handler)
	}

	const onReconnect = () => {
		const state = GroupStore.getState()

		if (state.groupId === groupId) {
			console.log("[socket] Reconnected! Triggering resilience sync...")
			state.actions.syncRTCChannels().catch(console.error)

			if (state.members.items.length > 0) {
				state.actions
					.evaluateConnections(state.members.items)
					.catch(console.error)
				state.actions
					.evaluateDecorations(state.members.items)
					.catch(console.error)
			}
		}
	}

	socket.on("connect", onReconnect)

	return () => {
		socket.topics.subscribe("group:unsubscribe", groupId)

		for (const [event, handler] of Object.entries(events)) {
			socket.off(event, handler)
		}

		socket.off("connect", onReconnect)
	}
}

export function subscribeUserSocket(): () => void {
	const socket = getSocket()

	if (!socket) {
		console.warn(
			"[socket] Socket not available, skipping user subscription",
		)
		return () => {}
	}

	const events = {
		"groups:membership:created": (payload: any) =>
			GroupsListStore.getState().actions.handleMembershipCreated(payload),
		"groups:membership:deleted": (payload: any) =>
			GroupsListStore.getState().actions.handleMembershipDeleted(payload),
	}

	for (const [event, handler] of Object.entries(events)) {
		socket.on(event, handler)
	}

	return () => {
		for (const [event, handler] of Object.entries(events)) {
			socket.off(event, handler)
		}
	}
}

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
	const actions = ChatStore.getState().actions

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
