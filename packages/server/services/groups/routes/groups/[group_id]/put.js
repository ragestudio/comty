import Groups from "@shared-classes/Spaces/Groups"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(req.params.group_id, req.auth.user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupPermissions.canPerformAction(
				req.auth.user_id,
				group,
				"UPDATE_GROUP",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to update this group",
			)
		}

		return await Groups.update(group, req.body)
	},
}
