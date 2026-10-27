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
		sessionKey: null,
		initialLoading: true,
		loading: false,
		loadingAfter: false,
		afterLoadVersion: 0,
		error: null,
		timeline: [],
		pendingMessages: [],
		hasMoreBefore: true,
		hasMoreAfter: true,
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
			loadingAfter: s.loadingAfter,
			initialLoading: s.initialLoading,
			usersTyping: s.usersTyping,
			isTyping: s.isTyping,
			hasMoreBefore: s.hasMoreBefore,
			hasMoreAfter: s.hasMoreAfter,
			type: s.type,
			sessionKey: s.sessionKey,
			pausedUpdates: s.pausedUpdates,
		})),
	)

export const useChatActions = () => ChatStore((s) => s.actions)

export const useChatTimeline = () => ChatStore((s) => s.timeline)

export const useChatTypingUsers = () => ChatStore((s) => s.usersTyping)

export const useChatStatus = () =>
	ChatStore(
		useShallow((s) => ({
			error: s.error,
			type: s.type,
			sessionKey: s.sessionKey,
			initialLoading: s.initialLoading,
		})),
	)

export const useChatPagination = () =>
	ChatStore(
		useShallow((s) => ({
			loading: s.loading,
			loadingAfter: s.loadingAfter,
			afterLoadVersion: s.afterLoadVersion,
			initialLoading: s.initialLoading,
			hasMoreBefore: s.hasMoreBefore,
			hasMoreAfter: s.hasMoreAfter,
		})),
	)

export type {
	ChatParams,
	ChatType,
	DmChatParams,
	GroupChatParams,
} from "./types"
export { getChatSessionKey } from "./types"
