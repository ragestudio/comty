import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { group_id, member_id } = req.params

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("KICK_MEMBERS")

		const membership = await GroupMemberships.getOneById(group_id, member_id)

		if (!membership) {
			throw new OperationError(404, "Membership not found")
		}

		// the owner cannot be removed, transfer ownership first
		if (membership.user_id === authz.group.owner_user_id) {
			throw new OperationError(403, "The group owner cannot be removed")
		}

		// leaving is handled by the leave endpoint
		if (membership.user_id === authz.userId) {
			throw new OperationError(
				400,
				"You cannot remove yourself, use the leave endpoint instead",
			)
		}

		if (
			!authz.canActOn({
				user_id: membership.user_id,
				roles: membership.roles,
			})
		) {
			throw new OperationError(
				403,
				"You cannot remove a member with an equal or higher role",
			)
		}

		return await GroupMemberships.delete(
			membership.user_id,
			membership._id,
			group_id,
			authz.group,
		)
	},
}
