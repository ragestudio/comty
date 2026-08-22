import type { ChannelMessage as base } from "@comty/shared/db/channel_messages"
import type { User } from "@comty/shared/types/user"

export interface Message extends Omit<base, "created_at" | "updated_at"> {
	created_at: Date | string
	updated_at?: Date | string

	user?: User
	cached_at?: number
}
