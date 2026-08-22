import type { GroupMembership as base } from "@comty/shared/db/group_memberships"
import type { User } from "../user"

export interface Member extends Omit<base, "created_at"> {
	created_at?: string

	user?: User
	roles?: any[]

	cached_at?: number
}

export interface Members {
	items: Member[]
	total_items?: number
	has_more?: boolean

	group_id?: string
	cached_at?: number
}
