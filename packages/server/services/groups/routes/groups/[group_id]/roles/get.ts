import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_MEMBERSHIPS")

		const items = await GroupRoles.getByGroupId(authz.group._id)

		return { items }
	},
})
