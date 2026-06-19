import API from "@services/rtc/rtc.service"
import type { Group } from "@db/groups"

import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

type MetaGroup = {
	group_v: number
	total_members: number
	total_channels: number
}

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		const { group_id } = req.params
		// @ts-ignore
		const user_id = req.auth.session.user_id

		let group = (await Groups.canUserIdReach(user_id, group_id)) as Group

		console.log(group)

		let meta: MetaGroup = {
			group_v: group.__v ?? 0,
			total_channels: 0,
			total_members: 0,
		}

		console.time("getTotalMembers")
		meta.total_members =
			await GroupMemberships.getTotalMembersByGroupId(group_id)
		console.timeEnd("getTotalMembers")

		console.time("getTotalChannels")
		meta.total_channels = await GroupChannels.getTotalByGroup(group)
		console.timeEnd("getTotalChannels")

		return meta
	},
})
