import Groups from "@classes/Groups"
import GroupMemberships from "@classes/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { group_id } = req.params
		const { user_id } = req.body
		const issuer_user_id = req.auth.session.user_id

		const group = await Groups.get(group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (group.owner_user_id !== issuer_user_id) {
			throw new OperationError(
				403,
				"You are not allowed to add a member to this group, use invites instead",
			)
		}

		return await GroupMemberships.create(user_id, group_id)
	},
}
