import type {
	GroupPermission,
	GroupPermissionMap,
} from "@comty/shared/types/spaces/permissions"
import type { GroupRole } from "@comty/shared/types/spaces/role"
import type { MemberRole } from "@comty/shared/types/spaces/member"

import {
	GROUP_PERMISSIONS,
	GROUP_PERMISSION_KEYS,
} from "@comty/shared/types/spaces/permissions"

const LEGACY_PERMISSION_KEYS = new Map<string, GroupPermission>(
	GROUP_PERMISSION_KEYS.map((permission) => [
		GROUP_PERMISSIONS[permission].key,
		permission,
	]),
)

export const RESERVED_ROLE_KEYS = new Set(["owner", "member"])

// permissions every member has by default, they can be overridden by
// persisting a member role row for the group
export const DEFAULT_MEMBER_PERMISSIONS: GroupPermissionMap = {
	READ_CHANNELS: true,
	WRITE_CHANNELS: true,
	READ_MEMBERSHIPS: true,
	MANAGE_INVITES: true,
	VOICE_CONNECT: true,
	VOICE_SPEAK: true,
	VOICE_STREAM: true,
}

export const createDefaultMemberRole = (group_id: string): GroupRole =>
	({
		group_id: group_id,
		role_key: "member",
		label: "Member",
		position: 0,
		is_default: true,
		permissions: { ...DEFAULT_MEMBER_PERMISSIONS },
	}) as GroupRole

export const ROLE_KEY_REGEX = /^[a-z0-9_]{2,32}$/

export const COLOR_REGEX = /^#[0-9a-f]{6}$/i

export const formatRoleLabel = (roleKey: string) => {
	return roleKey
		.split(/[_-]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ")
}

export const slugifyRoleKey = (value: string) => {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 32)
}

export const sanitizePermissions = (
	permissions: unknown,
): GroupPermissionMap => {
	if (!permissions || typeof permissions !== "object") {
		return {}
	}

	// the driver can decode maps as native Map instances
	const source =
		permissions instanceof Map
			? Object.fromEntries(permissions)
			: (permissions as Record<string, unknown>)

	const sanitized: GroupPermissionMap = {}

	for (const [rawKey, value] of Object.entries(source)) {
		if (value !== true) continue

		const permission =
			(GROUP_PERMISSION_KEYS.find((key) => key === rawKey) as
				GroupPermission | undefined) ?? LEGACY_PERMISSION_KEYS.get(rawKey)

		if (permission) {
			sanitized[permission] = true
		}
	}

	return sanitized
}

// the odm parses an empty map as a query operator and breaks while encoding.
// omit the column on insert and use a false tombstone to clear it on update.
export const serializePermissions = (
	permissions: GroupPermissionMap,
	{ allowEmpty = false }: { allowEmpty?: boolean } = {},
): GroupPermissionMap => {
	if (Object.keys(permissions).length > 0) {
		return permissions
	}

	if (!allowEmpty) {
		return undefined as any
	}

	return {
		ADMINISTRATOR: false,
	}
}

// make a loaded role safe to save again: the odm cannot encode empty maps
// nor native Map instances when the driver decodes them that way
export const ensureSerializablePermissions = (role: any) => {
	if (role.permissions instanceof Map) {
		role.permissions = Object.fromEntries(role.permissions)
	}

	if (
		role.permissions &&
		typeof role.permissions === "object" &&
		Object.keys(role.permissions).length === 0
	) {
		role.permissions = {
			ADMINISTRATOR: false,
		}
	}

	return role
}

export const resolveMemberRoles = (
	roles: (string | { _id?: string })[],
	rolesByKey: Map<string, GroupRole>,
	isOwner = false,
): MemberRole[] => {
	const roleKeys = new Set<string>()

	for (const role of Array.isArray(roles) ? roles : []) {
		if (typeof role === "string") {
			roleKeys.add(role)
			continue
		}

		if (role && typeof role._id === "string") {
			roleKeys.add(role._id)
		}
	}

	const resolved: MemberRole[] = []

	if (isOwner) {
		resolved.push({
			_id: "owner",
			label: "Owner",
			color: "orange",
		})
	}

	for (const roleKey of roleKeys) {
		if (roleKey === "member") continue

		const role = rolesByKey.get(roleKey)

		resolved.push({
			_id: roleKey,
			label: role?.label ?? formatRoleLabel(roleKey),
			color: role?.color,
		})
	}

	const memberRole = rolesByKey.get("member")

	resolved.push({
		_id: "member",
		label: memberRole?.label ?? "Member",
		color: memberRole?.color,
	})

	return resolved
}

export const normalizeRole = (role: any): GroupRole => {
	return {
		...role,
		label: role?.label ?? formatRoleLabel(role.role_key),
		color: role?.color || undefined,
		position: typeof role?.position === "number" ? role.position : 1,
		is_default: role?.is_default === true,
		permissions: sanitizePermissions(role?.permissions),
	}
}

export const validateRoleLabel = (label: unknown): string => {
	if (typeof label !== "string") {
		throw new OperationError(400, "Role label must be a string")
	}

	const normalized = label.trim()

	if (normalized.length < 1 || normalized.length > 32) {
		throw new OperationError(
			400,
			"Role label must be between 1 and 32 characters",
		)
	}

	return normalized
}

export const validateRoleColor = (color: unknown): string | undefined => {
	if (color === undefined || color === null || color === "") {
		return undefined
	}

	if (typeof color !== "string" || !COLOR_REGEX.test(color)) {
		throw new OperationError(400, "Role color must be a hex color")
	}

	return color.toLowerCase()
}
