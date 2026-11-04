import type { GroupRole } from "@comty/shared/types/spaces/role"

import GroupRolesModel from "@db/group_roles"
import { broadcastRolesUpdated } from "../broadcast"
import {
	ensureSerializablePermissions,
	normalizeRole,
	sanitizePermissions,
	serializePermissions,
	validateRoleColor,
	validateRoleLabel,
} from "../helpers"

export type UpdateRolePayload = {
	label?: string
	color?: string | null
	permissions?: unknown
	position?: number
}

export type UpdateRoleOptions = {
	allowAdministrator?: boolean
}

export default async function (
	group_id: string,
	role_key: string,
	payload: UpdateRolePayload,
	options: UpdateRoleOptions = {},
): Promise<GroupRole> {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (typeof role_key !== "string") {
		throw new OperationError(400, "role_key must be a string")
	}

	if (role_key === "owner") {
		throw new OperationError(403, "This role cannot be modified")
	}

	const isDefaultMember = role_key === "member"

	let role = await GroupRolesModel.findOne({
		group_id: group_id,
		role_key: role_key,
	})

	if (!role) {
		if (!isDefaultMember) {
			throw new OperationError(404, "Role not found")
		}

		// persist the default role the first time it is customized
		role = GroupRolesModel.obj({
			group_id: group_id,
			role_key: "member",
			label: "Member",
			position: 0,
			is_default: true,
			created_at: new Date(),
		})
	}

	if (payload.label !== undefined) {
		role.label = validateRoleLabel(payload.label)
	}

	if (payload.color !== undefined) {
		role.color = validateRoleColor(payload.color)
	}

	if (payload.permissions !== undefined) {
		const permissions = sanitizePermissions(payload.permissions)
		const hadAdministrator = role.permissions?.ADMINISTRATOR === true

		if (
			permissions.ADMINISTRATOR &&
			!hadAdministrator &&
			!options.allowAdministrator
		) {
			throw new OperationError(
				403,
				"Only the group owner can grant the administrator permission",
			)
		}

		role.permissions = serializePermissions(permissions, {
			allowEmpty: true,
		})
	}

	if (
		payload.position !== undefined &&
		!isDefaultMember &&
		Number.isFinite(payload.position) &&
		payload.position >= 0
	) {
		role.position = Math.floor(payload.position)
	}

	ensureSerializablePermissions(role)

	await role.save()

	broadcastRolesUpdated(group_id, {
		action: "updated",
		role_key: role_key,
	})

	return normalizeRole(role.toRaw())
}
