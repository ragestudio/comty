import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import Groups from "@shared-classes/Spaces/Groups"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { user_id } = (req.body ?? {}) as { user_id?: string }

		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		const authz = await Gatekeeper.fromRequest(req)

		if (!authz.isOwner) {
			throw new OperationError(
				403,
				"Only the group owner can transfer ownership",
			)
		}

		return await Groups.transferOwnership(authz.group, authz.userId, user_id)
	},
})
