import { useSpacesGroupStore } from "./useSpacesGroupStore"

type SocketInstance = {
	on: (event: string, handler: (...args: any[]) => void) => void
	off: (event: string, handler: (...args: any[]) => void) => void
	topics: {
		subscribe: (method: string, ...args: any[]) => Promise<any>
		unsubscribe?: (method: string, ...args: any[]) => Promise<any>
	}
}

type StoreApi = typeof useSpacesGroupStore

export const getSocket = (): SocketInstance | null =>
	globalThis.__comty_shared_state?.ws?.sockets?.get("main") ??
	app?.cores?.api?.socket?.() ??
	null

export function buildGroupSocketEvents(groupId: string, store: StoreApi) {
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

	const events = buildGroupSocketEvents(groupId, useSpacesGroupStore)

	socket.topics.subscribe("group:subscribe", groupId)

	for (const [event, handler] of Object.entries(events)) {
		socket.on(event, handler)
	}

	const onReconnect = () => {
		const state = useSpacesGroupStore.getState()
		if (state.groupId === groupId) {
			console.log("[socket] Reconnected! Triggering resilience sync...")
			state.actions.syncRTCChannels().catch(console.error)
			
			if (state.members.items.length > 0) {
				state.actions.evaluateConnections(state.members.items).catch(console.error)
				state.actions.evaluateDecorations(state.members.items).catch(console.error)
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
