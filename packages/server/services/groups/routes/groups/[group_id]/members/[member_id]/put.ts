import type API from "@services/groups/groups.service"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"
import Groups from "@shared-classes/Spaces/Groups"

export type MemberPutPayload = {
	add_roles: string[]
	remove_roles: string[]
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req, res) => {
		const user_id = req.auth.user_id
		const { group_id, member_id } = req.params as {
			group_id: string
			member_id: string
		}
		const payload = req.body as MemberPutPayload

		const group = await Groups.get(group_id)

		if (!group) {
			throw new OperationError(404, "group not found")
		}

		// search for member by id
		let member = await GroupMemberships.getOneById(group_id, member_id)

		if (!member) {
			throw new OperationError(404, "member not found")
		}

		// check for membership management permission
		if (
			!(await GroupPermissions.canPerformAction(
				user_id,
				group,
				"MANAGE_MEMBERSHIPS",
			))
		) {
			throw new OperationError(
				403,
				"you do not have permission to manage memberships",
			)
		}

		// if roles to update
		if (
			Array.isArray(payload.add_roles) ||
			Array.isArray(payload.remove_roles)
		) {
			member = await GroupRoles.updateMember({
				group: group,
				membership: member,
				user_id: member.user_id,
				add: payload.add_roles ?? [],
				remove: payload.remove_roles ?? [],
			})
		}

		return {
			ok: true,
			member: member,
		}
	},
})
