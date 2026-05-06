import UserConnections from "@shared-classes/UserConnections"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

import GroupsModel from "@db/groups"
import LastChannelMessageIdModel from "@db/group_channels_last_message_id"

export default {
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis", "scylla", "mediaChannels"],
	fn: async (req, res, ctx) => {
		const { group_id } = req.params

		const group = await GroupsModel.findOne(
			{ _id: group_id },
			{ raw: true },
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupMemberships.isUserIdOnMembers(
				req.auth.session.user_id,
				group_id,
			))
		) {
			throw new OperationError(403, "You are not a member of this group")
		}

		let state = {
			group: group,
			total_members: 0,
		}

		console.time("getLastChannelsMessages")
		let channels = await GroupChannels.getAllByGroupId(
			group,
			req.auth.session.user_id,
		)

		const channelsIds = channels.map((channel) => channel._id)

		state.last_channels_messages = await LastChannelMessageIdModel.find({
			channel_id: {
				$in: channelsIds,
			},
		})
		console.timeEnd("getLastChannelsMessages")

		console.time("getTotalMembersByGroupId")
		state.total_members =
			await GroupMemberships.getTotalMembersByGroupId(group_id)
		console.timeEnd("getTotalMembersByGroupId")

		console.time("getRtcState")
		state.rtc =
			(await ctx.mediaChannels.findChannelsByGroupId(group_id)) ?? []
		console.timeEnd("getRtcState")

		if (Array.isArray(state.rtc)) {
			// map channel clients
			state.rtc = state.rtc.map((channel) => {
				return {
					__v: channel.data.__v,
					_id: channel.data._id,
					clients: channel.getConnectedClientsSerialized(),
					producers: channel.getProducersSerialized(),
					started_at: channel.started_at,
				}
			})
		}

		// get connected users
		if (Array.isArray(state.memberships) && state.memberships.length > 0) {
			state.connected_members = await UserConnections.isUsersConnected(
				ctx.redis.client,
				state.memberships.map((member) => member.user_id),
			)

			// filter & map connected users ids
			state.connected_members = state.connected_members.filter(
				(c) => c.connected,
			)
			state.connected_members = state.connected_members.map(
				(c) => c.user_id,
			)
		}

		return state
	},
}
