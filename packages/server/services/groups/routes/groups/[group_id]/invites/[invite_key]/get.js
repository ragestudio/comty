import Groups from "@shared-classes/Spaces/Groups"
import GroupInvites from "@shared-classes/Spaces/GroupInvites"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { fetch } = req.query

		const group = await Groups.get(req.params.group_id, req.auth.user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const invite = await GroupInvites.get(group, req.params.invite_key)

		if (typeof fetch === "string" && fetch === "true") {
			return {
				...invite,
				...group,
			}
		}

		return invite
	},
}
