import type API from "@services/rtc/rtc.service"
import type { MetaGroup } from "@comty/shared/types/spaces/group"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { group_id } = req.params
		const user_id = req.auth.session.user_id

		const group = await Groups.canUserIdReach(user_id, group_id)

		const meta: MetaGroup = {
			group_v: group.__v ?? 0,
			total_channels: 0,
			total_members: 0,
		}

		meta.total_members =
			await GroupMemberships.getTotalMembersByGroupId(group_id)
		meta.total_channels = await GroupChannels.getTotalByGroup(group)

		const authz = await Gatekeeper.forGroup(group as any, user_id)
		const viewer = authz.toJSON()

		meta.viewer_permissions = viewer.permissions
		meta.viewer_roles = viewer.roles
		meta.is_owner = viewer.is_owner
		meta.is_admin = viewer.is_admin

		return meta
	},
})
