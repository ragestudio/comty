import Groups from "@shared-classes/Spaces/Groups"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import GroupInvites from "@shared-classes/Spaces/GroupInvites"

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
				"MANAGE_INVITES",
			))
		) {
			throw new OperationError(
				403,
				"You don't have permission to manage invites",
			)
		}

		return await GroupInvites.create(group, {
			issuer_user_id: req.auth.user_id,
			max_usage: req.body?.max_usage ?? 5,
			expires_at: req.body?.expires_at,
		})
	},
}
