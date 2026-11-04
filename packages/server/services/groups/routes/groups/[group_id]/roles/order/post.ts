import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_ROLES")

		const order = (req.body as any)?.order

		if (!Array.isArray(order)) {
			throw new OperationError(400, "order must be an array")
		}

		const roles = await GroupRoles.getByGroupId(authz.group._id)
		const rolesByKey = new Map(roles.map((role) => [role.role_key, role]))

		for (const roleKey of order) {
			if (typeof roleKey !== "string") {
				throw new OperationError(400, "order contains invalid roles")
			}

			const role = rolesByKey.get(roleKey)

			if (!role) {
				throw new OperationError(400, "order contains invalid roles")
			}

			if (!authz.canManageRole(role)) {
				throw new OperationError(403, "You cannot manage this role")
			}
		}

		const items = await GroupRoles.order(authz.group._id, order)

		return { items }
	},
})
