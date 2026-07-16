import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(req.params.group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		// check if the user trying to leave is the owner
		if (group.owner_user_id === req.auth.user_id) {
			throw new OperationError(
				403,
				"Owners cannot leave their own groups, delete the group instead",
			)
		}

		let membership = await GroupMemberships.model.find(
			{
				user_id: req.auth.user_id,
				group_id: req.params.group_id,
			},
			{
				raw: true,
			},
		)

		membership = membership[0]

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		await GroupMemberships.delete(
			req.auth.user_id,
			membership._id,
			req.params.group_id,
			group,
		)

		return membership
	},
}
