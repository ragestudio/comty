import type { Group as base } from "@comty/shared/db/groups"

import type { Channels } from "./channel"
import type { Members } from "./member"

export interface Group extends Omit<base, "created_at"> {
	created_at?: string

	channels: Channels
	members: Members

	cached_at?: number
	groupCoverImageAverageColor?: string
}
