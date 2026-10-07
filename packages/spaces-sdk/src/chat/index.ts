import type { ChatStoreType } from "./types"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import ChatSettersActions from "./actions/setters"
import ChatLifecycleActions from "./actions/lifecycle"
import ChatLoadingActions from "./actions/loading"
import ChatSyncActions from "./actions/sync"
import ChatMessagingActions from "./actions/messaging"
import ChatTypingActions from "./actions/typing"
import ChatEventsActions from "./actions/events"

export const ChatStore = create<ChatStoreType>()((set, get) => {
	const settersActions = new ChatSettersActions(set, get)
	const lifecycleActions = new ChatLifecycleActions(set, get)
	const loadingActions = new ChatLoadingActions(set, get)
	const syncActions = new ChatSyncActions(set, get)
	const messagingActions = new ChatMessagingActions(set, get)
	const typingActions = new ChatTypingActions(set, get)
	const eventsActions = new ChatEventsActions(set, get)

	return {
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
		initGeneration: 0,
		typingTimeout: null,
		isTypingNetworkState: false,

		actions: {
			pushToTimeline: settersActions.pushToTimeline,

			init: lifecycleActions.init,
			reset: lifecycleActions.reset,
			setPausedUpdates: lifecycleActions.setPausedUpdates,

			load: loadingActions.load,
			loadBefore: loadingActions.loadBefore,
			loadAfter: loadingActions.loadAfter,
			loadAround: loadingActions.loadAround,

			sync: syncActions.sync,

			send: messagingActions.send,
			sendReadAck: messagingActions.sendReadAck,

			typing: typingActions.typing,

			handleNewMessage: eventsActions.handleNewMessage,
			handleMessageDeleted: eventsActions.handleMessageDeleted,
			handleMessageUpdated: eventsActions.handleMessageUpdated,
			handleTypingEvent: eventsActions.handleTypingEvent,
		},
	}
})

export const useChatState = () =>
	ChatStore(
		useShallow((s) => ({
			timeline: s.timeline,
			error: s.error,
			loading: s.loading,
			initialLoading: s.initialLoading,
			usersTyping: s.usersTyping,
			isTyping: s.isTyping,
			hasMore: s.hasMore,
			type: s.type,
			pausedUpdates: s.pausedUpdates,
		})),
	)

export const useChatActions = () => ChatStore((s) => s.actions)
