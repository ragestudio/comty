import GroupRolesModel from "@db/group_roles"
import GroupMembershipsModel from "@db/group_memberships"
import { broadcastRolesUpdated } from "../broadcast"
import { RESERVED_ROLE_KEYS } from "../helpers"

export default async function (
	group_id: string,
	role_key: string,
): Promise<{ success: boolean }> {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (typeof role_key !== "string") {
		throw new OperationError(400, "role_key must be a string")
	}

	if (RESERVED_ROLE_KEYS.has(role_key)) {
		throw new OperationError(403, "This role cannot be deleted")
	}

	const role = await GroupRolesModel.findOne({
		group_id: group_id,
		role_key: role_key,
	})

	if (!role) {
		throw new OperationError(404, "Role not found")
	}

	// remove the role from every membership that still references it
	const memberships = (await GroupMembershipsModel.find(
		{
			group_id: group_id,
		},
		{
			raw: false,
		},
	)) as any[]

	for (const membership of memberships) {
		const roles = Array.isArray(membership.roles) ? membership.roles : []

		if (!roles.includes(role_key)) continue

		membership.roles = roles.filter(
			(existingRole: string) => existingRole !== role_key,
		)

		await membership.save()
	}

	await role.delete()

	broadcastRolesUpdated(group_id, {
		action: "deleted",
		role_key: role_key,
	})

	return { success: true }
}
