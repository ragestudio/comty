import type { GroupStoreType } from "./types"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { createDefaultChannels, createDefaultMembers } from "./constants"

import GroupFetchingActions from "../../actions/group/fetching"
import GroupEvaluateActions from "../../actions/group/evaluate"
import GroupLifecycleActions from "../../actions/group/lifecycle"
import GroupSettersActions from "../../actions/group/setters"
import GroupEventsActions from "../../actions/group/events"

export const GroupStore = create<GroupStoreType>()((set, get) => {
	const fetchingActions = new GroupFetchingActions(GroupStore)
	const evaluateActions = new GroupEvaluateActions(GroupStore)
	const lifecycleActions = new GroupLifecycleActions(GroupStore)
	const settersActions = new GroupSettersActions(GroupStore)
	const eventsActions = new GroupEventsActions(GroupStore)

	return {
		groupId: null,
		data: null,
		channels: createDefaultChannels(),
		members: createDefaultMembers(),
		statedChannels: {},
		connectedMembers: [],
		membersDecorations: {},
		loading: true,
		error: null,
		initGeneration: 0,
		userConnections: new Map(),
		decorationsCache: new Map(),

		actions: {
			fetchGroup: fetchingActions.fetchGroup,
			fetchChannels: fetchingActions.fetchChannels,
			fetchMembers: fetchingActions.fetchMembers,
			syncRTCChannels: evaluateActions.evaluateRTC,
			evaluateConnections: evaluateActions.evaluateConnections,
			evaluateDecorations: evaluateActions.evaluateDecorations,

			init: lifecycleActions.init,
			reset: lifecycleActions.reset,

			setData: settersActions.setData,
			setChannels: settersActions.setChannels,
			setMembers: settersActions.setMembers,
			setConnectedMembers: settersActions.setConnectedMembers,

			handleGroupUpdate: eventsActions.handleGroupUpdate,
			handleChannelCreated: eventsActions.handleChannelCreated,
			handleChannelDeleted: eventsActions.handleChannelDeleted,
			handleChannelUpdated: eventsActions.handleChannelUpdated,
			handleChannelsOrdered: eventsActions.handleChannelsOrdered,
			handleChannelNewMessage: eventsActions.handleChannelNewMessage,
			handleMembershipCreated: eventsActions.handleMembershipCreated,
			handleMembershipDeleted: eventsActions.handleMembershipDeleted,
			handleUserOnline: eventsActions.handleUserOnline,
			handleUserOffline: eventsActions.handleUserOffline,
			handleVoiceChannelStarted: eventsActions.handleVoiceChannelStarted,
			handleVoiceChannelEnded: eventsActions.handleVoiceChannelEnded,
			handleClientVoiceJoin: eventsActions.handleClientVoiceJoin,
			handleClientVoiceLeft: eventsActions.handleClientVoiceLeft,
			handleClientEvent: eventsActions.handleClientEvent,
			handleProducerOpen: eventsActions.handleProducerOpen,
			handleProducerClose: eventsActions.handleProducerClose,
		},
	}
})

export const useGroupStore = () => GroupStore((s) => useShallow((s) => s))
export const useGroupData = () => GroupStore((s) => s.data)
export const useGroupChannels = () => GroupStore((s) => s.channels)
export const useGroupMembers = () => GroupStore((s) => s.members)
export const useGroupRTC = () => GroupStore((s) => s.statedChannels)
export const useGroupConnections = () => GroupStore((s) => s.connectedMembers)
export const useGroupDecorations = () => GroupStore((s) => s.membersDecorations)
export const useGroupLoading = () => GroupStore((s) => s.loading)
export const useGroupError = () => GroupStore((s) => s.error)
export const useGroupActions = () => GroupStore((s) => s.actions)
