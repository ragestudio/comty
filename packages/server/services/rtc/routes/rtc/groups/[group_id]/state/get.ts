import type API from "@services/rtc/rtc.service"

import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import type {
	MediaChannel,
	SerializedMediaChannel,
} from "@classes/MediaChannel"

import GroupsModel from "@db/groups"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "scylla", "mediaChannels"] as const,
	fn: async (req, res, ctx) => {
		const { group_id } = req.params
		// @ts-ignore
		const user_id = req.auth.session.user_id

		const group = await GroupsModel.findOne(
			{ _id: group_id },
			{ raw: true },
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (!(await GroupMemberships.isUserIdOnMembers(user_id, group_id))) {
			throw new OperationError(403, "You are not a member of this group")
		}

		let state = (await ctx.mediaChannels.findChannelsByGroupId(
			group_id,
		)) as MediaChannel[]

		let result: SerializedMediaChannel[] = []

		if (Array.isArray(state)) {
			// map channel clients
			result = state.map((channel) => {
				return channel.serialize()
			})
		}

		return result
	},
})
