import type { User } from "@comty/shared/types/user"
import type { Message } from "@comty/shared/types/spaces/message"

export type MessageStatus = "sending" | "sent" | "error"

export interface ExtendedMessage extends Message {
	status?: MessageStatus
	nonce?: string
}

export interface ChatSyncState {
	chat_id: string
	last_synced_at: number
	last_message_id: string
	has_more_before: boolean
	has_more_after: boolean
}

export interface SpacesChatState {
	type: "group" | "dm" | null
	params: any
	initialLoading: boolean
	loading: boolean
	error: any
	timeline: ExtendedMessage[]
	hasMore: boolean
	usersTyping: any[]
	isTyping: boolean
	pausedUpdates: boolean

	initGeneration: number
	typingTimeout: any
	isTypingNetworkState: boolean

	actions: SpacesChatActions
}

export interface SpacesChatActions {
	init: (type: "group" | "dm", params: any) => Promise<void>
	reset: () => void
	setPausedUpdates: (paused: boolean) => void

	// methods
	load: (options?: {
		beforeId?: string
		afterId?: string
		limit?: number
	}) => Promise<void>
	loadBefore: (id?: string) => Promise<void>
	loadAfter: (id?: string) => Promise<void>
	loadAround: (messageId: string) => Promise<void>
	sync: () => Promise<void>
	send: (payload: any) => Promise<boolean>
	sendReadAck: (messageId: string) => void
	typing: (isTypingNow?: boolean) => void

	// helpers
	pushToTimeline: (
		newMessages: ExtendedMessage[],
		position?: "top" | "bottom",
	) => void

	// events
	handleNewMessage: (data: ExtendedMessage & { user?: User }) => void
	handleMessageDeleted: (data: { _id: string }) => void
	handleMessageUpdated: (data: any) => void
	handleTypingEvent: (data: any) => void
}

export type SpacesChatStoreType = SpacesChatState
