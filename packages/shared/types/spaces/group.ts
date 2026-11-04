import type { Group as base } from "@comty/shared/db/groups"

import type { Channels } from "./channel"
import type { Members } from "./member"
import type { GroupPermissionMap } from "./permissions"
import type { ViewerRole } from "./role"

export interface Group extends Omit<base, "created_at"> {
	created_at?: string

	channels: Channels
	members: Members

	cached_at?: number
	groupCoverImageAverageColor?: string

	viewer_permissions?: GroupPermissionMap
	viewer_roles?: ViewerRole[]
	is_owner?: boolean
	is_admin?: boolean
}

export type GroupViewer = {
	permissions: GroupPermissionMap
	roles: ViewerRole[]
	is_owner: boolean
	is_admin: boolean
}

export type MetaGroup = {
	group_v: number
	total_members: number
	total_channels: number

	viewer_permissions?: GroupPermissionMap
	viewer_roles?: ViewerRole[]
	is_owner?: boolean
	is_admin?: boolean
}
