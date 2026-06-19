import GroupRolesModel from "@db/group_roles"
import type { GroupRole } from "@db/group_roles"

export default class GroupRoles {
	static async getByGroupId(group_id: string): Promise<GroupRole[]> {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const roles = await GroupRolesModel.find(
			{
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		// add the default member role
		roles.push({
			group_id: group_id,
			role_key: "member",
			permissions: {
				READ_CHANNELS: true,
				WRITE_CHANNELS: true,
				READ_MEMBERSHIPS: true,
				MANAGE_INVITES: true,
			},
		})

		return roles
	}
}
