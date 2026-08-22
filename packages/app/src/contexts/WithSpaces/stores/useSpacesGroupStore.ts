import { create } from "zustand"
import { SpacesGroupStoreType } from "./group/types"
import { createDefaultChannels, createDefaultMembers } from "./group/constants"

import { createLifecycle } from "./group/actions/lifecycle"
import { createDataFetching } from "./group/actions/dataFetching"
import { createSetters } from "./group/actions/setters"
import { createGroupEvents } from "./group/actions/groupEvents"
import { createChannelEvents } from "./group/actions/channelEvents"
import { createMembershipEvents } from "./group/actions/membershipEvents"
import { createPresenceEvents } from "./group/actions/presenceEvents"
import { createVoiceEvents } from "./group/actions/voiceEvents"

export const useSpacesGroupStore = create<SpacesGroupStoreType>()((set, get) => ({
	groupId: null,
	data: null,
	channels: createDefaultChannels(),
	members: createDefaultMembers(),
	statedChannels: {},
	connectedMembers: [],
	membersDecorations: {},
	loading: true,
	error: null,

	actions: {
		...createLifecycle(set, get),
		...createDataFetching(set, get),
		...createSetters(set, get),
		...createGroupEvents(set, get),
		...createChannelEvents(set, get),
		...createMembershipEvents(set, get),
		...createPresenceEvents(set, get),
		...createVoiceEvents(set, get),
	},
}))

export const useGroupData = () => useSpacesGroupStore((s) => s.data)
export const useGroupChannels = () => useSpacesGroupStore((s) => s.channels)
export const useGroupMembers = () => useSpacesGroupStore((s) => s.members)
export const useGroupRTC = () => useSpacesGroupStore((s) => s.statedChannels)
export const useGroupConnections = () => useSpacesGroupStore((s) => s.connectedMembers)
export const useGroupDecorations = () => useSpacesGroupStore((s) => s.membersDecorations)
export const useGroupLoading = () => useSpacesGroupStore((s) => s.loading)
export const useGroupError = () => useSpacesGroupStore((s) => s.error)
export const useGroupActions = () => useSpacesGroupStore((s) => s.actions)
