export { VALID_CHANNEL_KINDS } from "./stores/group/constants"

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
} from "./stores/useSpacesGroupStore"

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
} from "./stores/group/types"

export {
	useSpacesNavigationStore,
	useSpacesNavigation,
	useNavigationActions,
} from "./stores/useSpacesNavigationStore"

export type {
	SpacesNavigationStoreType,
	NavigationType,
} from "./stores/navigation/types"

export { subscribeGroupSocket, buildGroupSocketEvents } from "./stores/events"

export * from "./stores/useSpacesChatStore"
export * from "./stores/chatEvents"

import { useSpacesChatStore } from "./stores/useSpacesChatStore"
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
