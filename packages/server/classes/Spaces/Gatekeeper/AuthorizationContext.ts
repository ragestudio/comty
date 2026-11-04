import type { Doc } from "@ragestudio/scylla-odm/types"
import type { Group } from "@db/groups"
import type { GroupMembership } from "@comty/shared/db/group_memberships"
import type {
	GroupPermission,
	GroupPermissionMap,
} from "@comty/shared/types/spaces/permissions"
import type { GroupRole, ViewerRole } from "@comty/shared/types/spaces/role"

import { GROUP_PERMISSION_KEYS } from "@comty/shared/types/spaces/permissions"
import { AuthorizationError } from "./errors"

const ROLE_POSITION_WEIGHT: Record<string, number> = {
	owner: Number.POSITIVE_INFINITY,
	admin: Number.POSITIVE_INFINITY,
	member: 0,
}

const getRoleKeys = (membership: GroupMembership | null): string[] => {
	if (!membership || !Array.isArray(membership.roles)) {
		return []
	}

	return membership.roles.filter((role) => typeof role === "string")
}

const getTopPosition = (
	roleKeys: Iterable<string>,
	rolesByKey: Map<string, GroupRole>,
): number => {
	let top = 0

	for (const roleKey of roleKeys) {
		const weighted = ROLE_POSITION_WEIGHT[roleKey]

		if (typeof weighted === "number") {
			top = Math.max(top, weighted)
			continue
		}

		const role = rolesByKey.get(roleKey)

		if (role) {
			top = Math.max(top, role.position ?? 0)
		}
	}

	return top
}

export default class AuthorizationContext {
	readonly group: Doc<Group>
	readonly membership: GroupMembership | null
	readonly userId: string
	readonly roles: GroupRole[]
	readonly roleKeys: Set<string>
	readonly rolesByKey: Map<string, GroupRole>
	readonly permissions: Set<GroupPermission>
	readonly hasMembership: boolean
	readonly isOwner: boolean
	readonly isAdmin: boolean
	readonly topPosition: number

	constructor(
		group: Doc<Group>,
		membership: GroupMembership | null,
		roles: GroupRole[],
		userId: string,
	) {
		this.group = group
		this.membership = membership
		this.userId = userId
		this.roles = roles

		const roleKeys = new Set(getRoleKeys(membership))

		this.isOwner = group.owner_user_id === userId
		this.hasMembership = Boolean(membership) || this.isOwner

		// every member always has the default role
		if (this.hasMembership) {
			roleKeys.add("member")
		}

		this.roleKeys = roleKeys
		this.rolesByKey = new Map(roles.map((role) => [role.role_key, role]))

		this.isAdmin =
			this.isOwner ||
			roleKeys.has("admin") ||
			Array.from(roleKeys).some(
				(roleKey) =>
					this.rolesByKey.get(roleKey)?.permissions?.ADMINISTRATOR ===
					true,
			)

		this.topPosition = this.isAdmin
			? Number.POSITIVE_INFINITY
			: getTopPosition(roleKeys, this.rolesByKey)

		const permissions = new Set<GroupPermission>()

		if (this.isAdmin) {
			for (const permission of GROUP_PERMISSION_KEYS) {
				permissions.add(permission)
			}
		} else {
			for (const roleKey of roleKeys) {
				const role = this.rolesByKey.get(roleKey)

				if (!role?.permissions) continue

				for (const permission of GROUP_PERMISSION_KEYS) {
					if (role.permissions[permission] === true) {
						permissions.add(permission)
					}
				}
			}
		}

		this.permissions = permissions
	}

	can(permission: GroupPermission): boolean {
		if (!GROUP_PERMISSION_KEYS.includes(permission)) {
			return false
		}

		return this.permissions.has(permission)
	}

	require(permission: GroupPermission, message?: string): void {
		if (this.can(permission)) return

		throw new AuthorizationError(
			message ?? `You are not allowed to perform this action`,
		)
	}

	hasRole(roleKey: string): boolean {
		return this.roleKeys.has(roleKey)
	}

	canManageRole(role: Pick<GroupRole, "role_key" | "position">): boolean {
		if (role.role_key === "owner") {
			return false
		}

		// the default role can only be customized by group administrators
		if (role.role_key === "member") {
			return this.isAdmin
		}

		if (this.isAdmin) {
			return true
		}

		return (role.position ?? 0) < this.topPosition
	}

	canAssignRole(roleKey: string): boolean {
		if (roleKey === "admin") {
			return this.isOwner
		}

		if (roleKey === "owner" || roleKey === "member") {
			return false
		}

		const role = this.rolesByKey.get(roleKey)

		if (!role) {
			return false
		}

		return this.canManageRole(role)
	}

	canRemoveRole(roleKey: string): boolean {
		if (roleKey === "member" || roleKey === "owner") {
			return false
		}

		if (roleKey === "admin") {
			return this.isOwner
		}

		const role = this.rolesByKey.get(roleKey)

		if (!role) {
			return false
		}

		return this.canManageRole(role)
	}

	canActOn(target: {
		user_id: string
		roles?: (string | { _id: string })[]
	}): boolean {
		if (!target) return false

		// the owner is never manageable by other members
		if (target.user_id === this.group.owner_user_id) {
			return false
		}

		if (this.isOwner) {
			return target.user_id !== this.userId
		}

		if (target.user_id === this.userId) {
			return false
		}

		const targetRoleKeys = (Array.isArray(target.roles) ? target.roles : [])
			.map((role) => (typeof role === "string" ? role : role?._id))
			.filter((role): role is string => typeof role === "string")

		const targetTop = getTopPosition(targetRoleKeys, this.rolesByKey)

		return this.topPosition > targetTop
	}

	getViewerRoles(): ViewerRole[] {
		const viewerRoles: ViewerRole[] = []

		if (this.isOwner) {
			viewerRoles.push({
				_id: "owner",
				label: "Owner",
				color: "orange",
			})
		}

		for (const roleKey of this.roleKeys) {
			if (roleKey === "member" || roleKey === "owner") continue

			const role = this.rolesByKey.get(roleKey)

			viewerRoles.push({
				_id: roleKey,
				label: role?.label ?? roleKey,
				color: role?.color,
			})
		}

		if (this.hasMembership) {
			const memberRole = this.rolesByKey.get("member")

			viewerRoles.push({
				_id: "member",
				label: memberRole?.label ?? "Member",
				color: memberRole?.color,
			})
		}

		return viewerRoles
	}

	toJSON() {
		const permissions: GroupPermissionMap = {}

		for (const permission of GROUP_PERMISSION_KEYS) {
			permissions[permission] = this.can(permission)
		}

		return {
			permissions,
			roles: this.getViewerRoles(),
			is_owner: this.isOwner,
			is_admin: this.isAdmin,
		}
	}
}
