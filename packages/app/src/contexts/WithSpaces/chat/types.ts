import { Message } from "../collections/message"

export type MessageStatus = "sending" | "sent" | "error"

export interface ExtendedMessage extends Message {
	status?: MessageStatus
	nonce?: string
}

export interface ChatSyncState {
	chat_id: string // channel_id or to_user_id
	last_synced_at: number
	last_message_id: string
	has_more_before: boolean
	has_more_after: boolean
}

export type T_UseChatMessagesArgs = {
	type: string
	config: any
	params: any
	events: any
}
