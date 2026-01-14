import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(
			req.params.group_id,
			req.auth.session.user_id,
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupPermissions.canPerformAction(
				req.auth.user_id,
				group,
				"READ_MEMBERSHIPS",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to delete members",
			)
		}

		let membership = await GroupMemberships.get(
			group._id,
			req.params.member_id,
		)

		if (!membership) {
			throw new OperationError(404, "Membership not found")
		}

		membership = membership.toJSON()

		if (!Array.isArray(membership.roles)) {
			membership.roles = []
		}

		membership.roles.push({
			_id: "member",
			label: "Member",
		})

		return membership
	},
}
