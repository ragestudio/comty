import Groups from "@shared-classes/Spaces/Groups"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { group_id, action } = req.params

		const group = await Groups.model.findOneAsync({
			_id: group_id,
		})

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const result = await GroupPermissions.canPerformAction(
			req.auth.user_id,
			group,
			action,
		)

		return {
			result,
		}
	},
}
