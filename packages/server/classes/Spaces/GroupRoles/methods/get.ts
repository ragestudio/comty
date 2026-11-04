import type { GroupRole } from "@comty/shared/types/spaces/role"

import GroupRolesModel from "@db/group_roles"
import { createDefaultMemberRole, normalizeRole } from "../helpers"

export default async function (
	group_id: string,
	role_key: string,
): Promise<GroupRole | null> {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (typeof role_key !== "string") {
		throw new OperationError(400, "role_key must be a string")
	}

	const role = await GroupRolesModel.findOne({
		group_id: group_id,
		role_key: role_key,
	})

	if (!role) {
		// the default member role exists virtually until it is persisted
		if (role_key === "member") {
			return createDefaultMemberRole(group_id)
		}

		return null
	}

	return normalizeRole(role.toRaw())
}
