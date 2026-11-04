import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_ROLES")

		const role = await GroupRoles.create(authz.group._id, req.body as any, {
			allowAdministrator: authz.isOwner,
		})

		return role
	},
})
