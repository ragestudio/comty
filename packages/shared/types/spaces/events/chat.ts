import type { Message } from "../message"

export interface SpacesChatOutboundEvents {
	"channel:message": Message
	"channel:message:deleted": {
		_id: string
		channel_id?: string
		group_id?: string
	}
	"channel:message:updated": Partial<Message> & { _id: string }
	"channel:typing": { user_id: string; channel_id: string; typing: boolean }
}
