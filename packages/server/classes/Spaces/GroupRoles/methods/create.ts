import type { GroupRole } from "@comty/shared/types/spaces/role"

import GroupRolesModel from "@db/group_roles"
import { broadcastRolesUpdated } from "../broadcast"
import {
	RESERVED_ROLE_KEYS,
	ROLE_KEY_REGEX,
	sanitizePermissions,
	serializePermissions,
	slugifyRoleKey,
	validateRoleColor,
	validateRoleLabel,
} from "../helpers"

export type CreateRolePayload = {
	label: string
	role_key?: string
	color?: string
	permissions?: unknown
}

export type CreateRoleOptions = {
	allowAdministrator?: boolean
}

const generateRoleKey = (label: string, existingKeys: Set<string>) => {
	const base = slugifyRoleKey(label) || "role"

	let roleKey = base

	if (RESERVED_ROLE_KEYS.has(roleKey)) {
		roleKey = `${base}_role`
	}

	while (existingKeys.has(roleKey)) {
		roleKey = `${base}_${Math.random().toString(36).slice(2, 6)}`
	}

	return roleKey
}

export default async function (
	group_id: string,
	payload: CreateRolePayload,
	options: CreateRoleOptions = {},
): Promise<GroupRole> {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const label = validateRoleLabel(payload?.label)
	const color = validateRoleColor(payload?.color)
	const permissions = sanitizePermissions(payload?.permissions)

	if (permissions.ADMINISTRATOR && !options.allowAdministrator) {
		throw new OperationError(
			403,
			"Only the group owner can grant the administrator permission",
		)
	}

	const existingRoles = (await GroupRolesModel.find(
		{
			group_id: group_id,
		},
		{
			raw: true,
		},
	)) as any[]

	const existingKeys = new Set(
		existingRoles.map((role) => String(role.role_key)),
	)

	let roleKey = payload?.role_key?.trim()

	if (roleKey) {
		if (!ROLE_KEY_REGEX.test(roleKey) || RESERVED_ROLE_KEYS.has(roleKey)) {
			throw new OperationError(400, "Invalid role key")
		}

		if (existingKeys.has(roleKey)) {
			throw new OperationError(409, "Role key already exists")
		}
	} else {
		roleKey = generateRoleKey(label, existingKeys)
	}

	// new roles start at the bottom, just above the default member role
	const position = 1

	const storedPermissions = serializePermissions(permissions)

	const role = GroupRolesModel.obj({
		group_id: group_id,
		role_key: roleKey,
		label: label,
		color: color,
		position: position,
		is_default: false,
		...(storedPermissions ? { permissions: storedPermissions } : {}),
		created_at: new Date(),
	})

	await role.save()

	broadcastRolesUpdated(group_id, {
		action: "created",
		role_key: roleKey,
	})

	return {
		...role.toRaw(),
		label: label,
		color: color,
		position: position,
		is_default: false,
		permissions: permissions,
	}
}
