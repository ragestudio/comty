import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupBans from "@shared-classes/Spaces/GroupBans"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { member_id } = req.params as {
			group_id: string
			member_id: string
		}
		const reason = (req.body as any)?.reason

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("BAN_MEMBERS")

		const membership = await GroupMemberships.getOneById(
			authz.group._id,
			member_id,
		)

		if (!membership) {
			throw new OperationError(404, "Membership not found")
		}

		if (membership.user_id === authz.group.owner_user_id) {
			throw new OperationError(403, "The group owner cannot be banned")
		}

		if (membership.user_id === authz.userId) {
			throw new OperationError(400, "You cannot ban yourself")
		}

		if (
			!authz.canActOn({
				user_id: membership.user_id,
				roles: membership.roles,
			})
		) {
			throw new OperationError(
				403,
				"You cannot ban a member with an equal or higher role",
			)
		}

		await GroupBans.create({
			group_id: authz.group._id,
			user_id: membership.user_id,
			banned_by: authz.userId,
			reason,
		})

		await GroupMemberships.delete(
			membership.user_id,
			membership._id,
			authz.group._id,
			authz.group,
		)

		return { ok: true }
	},
})
