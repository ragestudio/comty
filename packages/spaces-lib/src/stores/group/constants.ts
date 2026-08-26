import type { Channels } from "@comty/shared/types/spaces/channel"
import type { Members } from "@comty/shared/types/spaces/member"

export const VALID_CHANNEL_KINDS = ["chat", "voice"] as const
export const INITIAL_CACHE_PAGE_SIZE = 50

export const createDefaultChannels = (): Channels => ({
	items: [],
	total_items: 0,
	has_more: false,
})

export const createDefaultMembers = (): Members => ({
	items: [],
	total_items: 0,
	has_more: false,
})
