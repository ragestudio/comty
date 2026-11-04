import type API from "@services/rtc/rtc.service"

import { GROUP_PERMISSION_KEYS } from "@comty/shared/types/spaces/permissions"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import Groups from "@shared-classes/Spaces/Groups"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { group_id } = req.params
		const user_id = req.auth.user_id ?? req.auth.session.user_id

		const group = await Groups.canUserIdReach(user_id, group_id)

		const rawGroup =
			typeof (group as any).toRaw === "function"
				? (group as any).toRaw()
				: group

		const authz = await Gatekeeper.forGroup(rawGroup as any, user_id)
		const viewer = authz.toJSON()

		// the owner always has every permission, even if the membership
		// row is missing or out of sync
		if (rawGroup.owner_user_id === user_id) {
			for (const permission of GROUP_PERMISSION_KEYS) {
				viewer.permissions[permission] = true
			}

			viewer.is_owner = true
			viewer.is_admin = true
		}

		return {
			...rawGroup,
			viewer_permissions: viewer.permissions,
			viewer_roles: viewer.roles,
			is_owner: viewer.is_owner,
			is_admin: viewer.is_admin,
		}
	},
})
