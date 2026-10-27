import type { User } from "@comty/shared/types/user"
import type { Message } from "@comty/shared/types/spaces/message"

export type MessageStatus = "sending" | "sent" | "error"

export type ChatType = "group" | "dm"

export interface GroupChatParams {
	group_id: string
	channel_id: string
	to_user_id?: never
}

export interface DmChatParams {
	to_user_id: string
	group_id?: never
	channel_id?: never
}

export type ChatParams = GroupChatParams | DmChatParams

export function getChatSessionKey(type: ChatType, params: ChatParams) {
	if (type === "group") {
		const groupParams = params as GroupChatParams

		return `group:${groupParams.group_id}:${groupParams.channel_id}`
	}

	return `dm:${(params as DmChatParams).to_user_id}`
}

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

export interface ChatStoreState {
	type: ChatType | null
	params: ChatParams | null
	sessionKey: string | null
	initialLoading: boolean
	loading: boolean
	loadingAfter: boolean
	afterLoadVersion: number
	error: any
	timeline: ExtendedMessage[]
	pendingMessages: ExtendedMessage[]
	hasMoreBefore: boolean
	hasMoreAfter: boolean
	usersTyping: any[]
	isTyping: boolean
	pausedUpdates: boolean

	initGeneration: number
	typingTimeout: any
	isTypingNetworkState: boolean
}

export interface ChatStoreActions {
	init: (type: ChatType, params: ChatParams) => Promise<void>
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
	send: (payload: any) => Promise<boolean | null>
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

export type ChatStoreType = ChatStoreState & {
	actions: ChatStoreActions
}

export interface ChatConfig {
	events: {
		message: string
		messageUpdated: string
		messageDeleted: string
		typing: string
	}
	methods: {
		send: string
		subscribe: string
		unsubscribe: string
		typing: string
	}
	model: {
		get: (params: any, options?: any) => Promise<any>
	}
	params: {
		send: (params: any, data: any) => any
		subscribe: (params: any) => any
		unsubscribe: (params: any) => any
		typing: (params: any, isTyping: boolean) => any
	}
}
