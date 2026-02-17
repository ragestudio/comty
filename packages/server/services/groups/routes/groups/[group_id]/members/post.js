import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

// Make sure to only allow admins to create members manualy
export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { group_id } = req.params
		const { user_id } = req.body

		const group = await Groups.get(group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		return await GroupMemberships.create(group._id, user_id)
	},
}
