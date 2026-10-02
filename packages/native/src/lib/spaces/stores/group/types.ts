import type { Group } from "@comty/shared/types/spaces/group"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"
import type { StatedChannel } from "@comty/shared/types/rtc/statedChannel"
import type { Member, Members } from "@comty/shared/types/spaces/member"
import type { Message } from "@comty/shared/types/spaces/message"

export interface GroupUpdatePayload {
	_id: string
	[key: string]: any
}

export interface MembershipCreatedPayload {
	group_id: string
	membership_id: string
	user_id: string
	user?: any
}

export interface MembershipDeletedPayload {
	membership_id: string
	user_id: string
	group_id: string
}

export interface ClientVoiceJoinPayload {
	channelId: string
	userId: string
	user: any
	voiceState: any
}

export interface ClientVoiceLeftPayload {
	channelId: string
	userId: string
}

export interface ClientEventPayload {
	event: string
	channelId: string
	userId: string
	data: any
}

export interface ProducerOpenPayload {
	channelId: string
	producer: any
}

export interface ProducerClosePayload {
	channelId: string
	producer: { id: string; [key: string]: any }
}

export type UserConnectionReference = {
	connected: boolean
}

export interface CachedGroup {
	group: Group | null
	memberships: Member[] | null
	total_members: number | null
	channels: Channels | null
}

export interface GroupStoreState {
	groupId: string | null
	data: Group | null
	channels: Channels
	members: Members
	statedChannels: Record<string, StatedChannel>
	connectedMembers: string[]
	membersDecorations: Record<string, any>
	loading: boolean
	error: Error | null

	initGeneration: number
	userConnections: Map<string, UserConnectionReference>
	decorationsCache: Map<string, any>
}

export interface GroupStoreActions {
	init: (groupId: string) => Promise<void>
	reset: () => void
	fetchGroup: () => Promise<Group | null>
	fetchChannels: () => Promise<Channels | null>
	fetchMembers: () => Promise<void>
	syncRTCChannels: () => Promise<void>
	evaluateConnections: (members: Member[]) => Promise<void>
	evaluateDecorations: (items: (Member | string)[]) => Promise<void>
	setData: (data: Group | null) => void
	setChannels: (updater: Channels | ((prev: Channels) => Channels)) => void
	setMembers: (updater: Members | ((prev: Members) => Members)) => void
	setConnectedMembers: (
		updater: string[] | ((prev: string[]) => string[]),
	) => void
	handleGroupUpdate: (payload: GroupUpdatePayload) => void
	handleChannelCreated: (payload: Channel) => void
	handleChannelDeleted: (payload: Channel) => void
	handleChannelUpdated: (payload: Channel) => void
	handleChannelsOrdered: (payload: string[]) => void
	handleChannelNewMessage: (payload: Message) => void
	handleMembershipCreated: (
		payload: MembershipCreatedPayload,
	) => Promise<void>
	handleMembershipDeleted: (payload: MembershipDeletedPayload) => void
	handleUserOnline: (payload: { userId: string }) => void
	handleUserOffline: (payload: { userId: string }) => void
	handleVoiceChannelStarted: (payload: {
		channelId: string
		started_at?: string
	}) => void
	handleVoiceChannelEnded: (payload: { channelId: string }) => void
	handleClientVoiceJoin: (payload: ClientVoiceJoinPayload) => void
	handleClientVoiceLeft: (payload: ClientVoiceLeftPayload) => void
	handleClientEvent: (payload: ClientEventPayload) => void
	handleProducerOpen: (payload: ProducerOpenPayload) => void
	handleProducerClose: (payload: ProducerClosePayload) => void
}

export type GroupStoreType = GroupStoreState & {
	actions: GroupStoreActions
}
