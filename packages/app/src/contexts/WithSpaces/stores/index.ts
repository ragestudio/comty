export { VALID_CHANNEL_KINDS } from "./group/constants"

export {
	useSpacesGroupStore,
	useGroupData,
	useGroupChannels,
	useGroupMembers,
	useGroupRTC,
	useGroupConnections,
	useGroupDecorations,
	useGroupLoading,
	useGroupError,
	useGroupActions,
} from "./useSpacesGroupStore"

export type {
	SpacesGroupStoreType,
	UserConnectionReference,
	CachedGroup,
	MembershipCreatedPayload,
	MembershipDeletedPayload,
	ClientVoiceJoinPayload,
	ClientVoiceLeftPayload,
	ClientEventPayload,
	ProducerOpenPayload,
	ProducerClosePayload,
	GroupUpdatePayload,
} from "./group/types"

export {
	useSpacesNavigationStore,
	useSpacesNavigation,
	useNavigationActions,
} from "./useSpacesNavigationStore"

export type {
	SpacesNavigationStoreType,
	NavigationType,
} from "./navigation/types"

export {
	subscribeGroupSocket,
	buildGroupSocketEvents,
	getSocket,
} from "./events"

export * from "./useSpacesChatStore"
export * from "./chatEvents"

import { useSpacesChatStore } from "./useSpacesChatStore"
import { useShallow } from "zustand/react/shallow"

export const useChatState = () =>
	useSpacesChatStore(
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

export const useChatActions = () => useSpacesChatStore((s) => s.actions)
