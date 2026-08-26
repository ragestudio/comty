import { create } from "zustand"
import { SpacesGroupStoreType } from "./group/types"
import { createDefaultChannels, createDefaultMembers } from "./group/constants"

import GroupFetchingActions from "../actions/group/fetching"
import GroupEvaluateActions from "../actions/group/evaluate"
import GroupLifecycleActions from "../actions/group/lifecycle"
import GroupSettersActions from "../actions/group/setters"
import GroupEventsActions from "../actions/group/events"

export const useSpacesGroupStore = create<SpacesGroupStoreType>()((
	set,
	get,
) => {
	const fetchingActions = new GroupFetchingActions(set, get)
	const evaluateActions = new GroupEvaluateActions(set, get)
	const lifecycleActions = new GroupLifecycleActions(set, get)
	const settersActions = new GroupSettersActions(set, get)
	const eventsActions = new GroupEventsActions(set, get)

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

export const useGroupData = () => useSpacesGroupStore((s) => s.data)
export const useGroupChannels = () => useSpacesGroupStore((s) => s.channels)
export const useGroupMembers = () => useSpacesGroupStore((s) => s.members)
export const useGroupRTC = () => useSpacesGroupStore((s) => s.statedChannels)
export const useGroupConnections = () =>
	useSpacesGroupStore((s) => s.connectedMembers)
export const useGroupDecorations = () =>
	useSpacesGroupStore((s) => s.membersDecorations)
export const useGroupLoading = () => useSpacesGroupStore((s) => s.loading)
export const useGroupError = () => useSpacesGroupStore((s) => s.error)
export const useGroupActions = () => useSpacesGroupStore((s) => s.actions)
