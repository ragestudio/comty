import type { GroupMembership as base } from "@comty/shared/db/group_memberships"
import type { User } from "../user"

export interface MemberRole {
	_id: string
	label: string
	color?: string
}

export interface Member extends Omit<Omit<base, "created_at">, "roles"> {
	created_at?: Date

	roles: MemberRole[]
	user?: User
	cached_at?: number
}

export interface Members {
	items: Member[]
	total_items?: number
	has_more?: boolean

	group_id?: string
	cached_at?: number
}
