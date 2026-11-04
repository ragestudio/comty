import type { GroupRole } from "@comty/shared/types/spaces/role"

import GroupRolesModel from "@db/group_roles"
import { broadcastRolesUpdated } from "../broadcast"
import {
	ensureSerializablePermissions,
	normalizeRole,
	RESERVED_ROLE_KEYS,
} from "../helpers"

export default async function (
	group_id: string,
	order: string[],
): Promise<GroupRole[]> {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (!Array.isArray(order)) {
		throw new OperationError(400, "order must be an array")
	}

	const roleKeys = order.filter(
		(roleKey) =>
			typeof roleKey === "string" && !RESERVED_ROLE_KEYS.has(roleKey),
	)

	if (roleKeys.length !== order.length) {
		throw new OperationError(400, "order contains invalid roles")
	}

	const roles = (await GroupRolesModel.find(
		{
			group_id: group_id,
		},
		{
			raw: false,
		},
	)) as any[]

	const rolesByKey = new Map(roles.map((role) => [String(role.role_key), role]))

	if (roleKeys.length !== rolesByKey.size) {
		throw new OperationError(400, "order must include every role of the group")
	}

	const updated: GroupRole[] = []

	for (let index = 0; index < roleKeys.length; index++) {
		const roleKey = roleKeys[index]
		const role = rolesByKey.get(roleKey)

		if (!role) {
			throw new OperationError(400, `Role ${roleKey} not found`)
		}

		// the first item is the most powerful role
		role.position = roleKeys.length - index

		ensureSerializablePermissions(role)

		await role.save()

		updated.push(normalizeRole(role.toRaw()))
	}

	broadcastRolesUpdated(group_id, {
		action: "ordered",
	})

	return updated
}
