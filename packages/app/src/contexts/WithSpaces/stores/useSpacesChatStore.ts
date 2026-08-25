import { create } from "zustand"
import { SpacesChatStoreType } from "./chat/types"

import ChatSettersActions from "../actions/chat/setters"
import ChatLifecycleActions from "../actions/chat/lifecycle"
import ChatLoadingActions from "../actions/chat/loading"
import ChatSyncActions from "../actions/chat/sync"
import ChatMessagingActions from "../actions/chat/messaging"
import ChatTypingActions from "../actions/chat/typing"
import ChatEventsActions from "../actions/chat/events"

export const useSpacesChatStore = create<SpacesChatStoreType>()((set, get) => {
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
