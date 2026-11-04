import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupBans from "@shared-classes/Spaces/GroupBans"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { user_id } = req.params as { user_id: string }

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("BAN_MEMBERS")

		return await GroupBans.remove(authz.group._id, user_id)
	},
})
