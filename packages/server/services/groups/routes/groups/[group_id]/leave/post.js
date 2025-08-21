import GroupMemberships from "@classes/GroupMemberships"
import Groups from "@classes/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(req.params.group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		// check if the user trying to leave is the owner
		if (group.owner_user_id === req.auth.session.user_id) {
			throw new OperationError(
				403,
				"Owners cannot leave their own groups, delete the group instead",
			)
		}

		// check if the user is a member of the group
		const membership = group.memberships.find(
			(membership) => membership.user_id === req.auth.session.user_id,
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		await GroupMemberships.delete(
			membership._id.toString(),
			req.params.group_id,
			req.auth.session.user_id,
		)

		return membership
	},
}
