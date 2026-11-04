import type { GroupRole as base } from "@comty/shared/db/group_roles"
import type { GroupPermissionMap } from "./permissions"

export interface ViewerRole {
	_id: string
	label: string
	color?: string
}

export interface GroupRole extends Omit<
	base,
	"permissions" | "label" | "color" | "position" | "is_default"
> {
	permissions: GroupPermissionMap
	label: string
	color?: string
	position: number
	is_default?: boolean
}
