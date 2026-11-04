import type API from "@services/groups/groups.service"

import { GROUP_PERMISSION_KEYS } from "@comty/shared/types/spaces/permissions"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)
		const viewer = authz.toJSON()

		// the owner always has every permission
		if (authz.isOwner) {
			for (const permission of GROUP_PERMISSION_KEYS) {
				viewer.permissions[permission] = true
			}

			viewer.is_owner = true
			viewer.is_admin = true
		}

		return viewer
	},
})
