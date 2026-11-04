import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)
		const { role_key } = req.params as { role_key: string }

		authz.require("MANAGE_ROLES")

		const role = await GroupRoles.get(authz.group._id, role_key)

		if (!role) {
			throw new OperationError(404, "Role not found")
		}

		if (!authz.canManageRole(role)) {
			throw new OperationError(403, "You cannot manage this role")
		}

		return await GroupRoles.update(authz.group._id, role_key, req.body as any, {
			allowAdministrator: authz.isOwner,
		})
	},
})
